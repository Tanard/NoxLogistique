-- ============================================================================
-- Migration 007 — RBAC Overhaul
-- ⚠️  EXÉCUTER EN DEUX ÉTAPES SÉPARÉES dans le SQL Editor Supabase
--
-- ÉTAPE 1 : Exécuter uniquement les ALTER TYPE ci-dessous (lignes 13-14)
--           PostgreSQL interdit d'utiliser un nouvel enum dans la même transaction
--
-- ÉTAPE 2 : Exécuter le reste du fichier (à partir de la ligne 18)
-- ============================================================================

-- ─── ÉTAPE 1 — Nouveaux enum values (exécuter seuls, puis committer) ─────────
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin' BEFORE 'admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'utilisateur' BEFORE 'viewer';

-- ─── ÉTAPE 2 — Tout le reste (exécuter après l'étape 1) ──────────────────────

-- ─── 2. Nouvelles colonnes festival_members ───────────────────────────────────
-- NULL = pas de restriction (rétrocompatible, membres existants non impactés)
ALTER TABLE public.festival_members
  ADD COLUMN IF NOT EXISTS poles              text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS module_permissions jsonb  DEFAULT '{}';
-- module_permissions structure : { "general": "edit"|"view", "map": "edit"|"view", ... }
-- clé absente = pas d'accès ; '{}' vide = pas de restriction (admin/manager)

-- ─── 3. Champ pole sur todos ──────────────────────────────────────────────────
-- NULL = tâche générale visible par tous les membres du festival
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS pole public.pole_type DEFAULT NULL;

-- ─── 4. Fonctions RLS mises à jour ───────────────────────────────────────────

-- is_any_admin : inclut maintenant super_admin ET admin
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_super_admin : seul role pouvant gérer d'autres admins
CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = uid AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- can_edit_festival : inclure 'utilisateur'
CREATE OR REPLACE FUNCTION public.can_edit_festival(uid UUID, fid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = uid AND festival_id = fid
      AND role IN ('super_admin', 'admin', 'pole_manager', 'utilisateur')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_festival_admin : super_admin + admin (pour gates delete/admin ops)
CREATE OR REPLACE FUNCTION public.is_festival_admin(uid UUID, fid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = uid AND festival_id = fid
      AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_festival_manager : super_admin + admin + pole_manager
CREATE OR REPLACE FUNCTION public.is_festival_manager(uid UUID, fid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = uid AND festival_id = fid
      AND role IN ('super_admin', 'admin', 'pole_manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 5. RLS festival_members ──────────────────────────────────────────────────

DROP POLICY IF EXISTS festival_members_select ON public.festival_members;
CREATE POLICY festival_members_select ON public.festival_members FOR SELECT
  USING (
    festival_id IN (SELECT public.user_festival_ids(auth.uid()))
    OR public.is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.festival_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.festival_id = festival_members.festival_id
        AND fm.role IN ('super_admin', 'admin', 'pole_manager')
    )
  );

-- INSERT : hiérarchie stricte
DROP POLICY IF EXISTS festival_members_admin_insert ON public.festival_members;
CREATE POLICY festival_members_admin_insert ON public.festival_members FOR INSERT
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.is_any_admin() AND role NOT IN ('admin', 'super_admin'))
    OR (public.is_festival_manager(auth.uid(), festival_id) AND role NOT IN ('admin', 'super_admin', 'pole_manager'))
  );

-- UPDATE : ne peut pas modifier un membre de rang >= au sien, ni soi-même
DROP POLICY IF EXISTS festival_members_admin_update ON public.festival_members;
CREATE POLICY festival_members_admin_update ON public.festival_members FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_any_admin()
      AND user_id != auth.uid()
      AND (SELECT role FROM public.festival_members fm2 WHERE fm2.id = festival_members.id)
          NOT IN ('admin', 'super_admin')
    )
    OR (
      public.is_festival_manager(auth.uid(), festival_id)
      AND (SELECT role FROM public.festival_members fm2 WHERE fm2.id = festival_members.id)
          NOT IN ('admin', 'super_admin', 'pole_manager')
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.is_any_admin() AND role NOT IN ('admin', 'super_admin'))
    OR (public.is_festival_manager(auth.uid(), festival_id) AND role NOT IN ('admin', 'super_admin', 'pole_manager'))
  );

DROP POLICY IF EXISTS festival_members_admin_delete ON public.festival_members;
CREATE POLICY festival_members_admin_delete ON public.festival_members FOR DELETE
  USING (
    public.is_any_admin()
    OR public.is_festival_manager(auth.uid(), festival_id)
  );

-- ─── 6. RLS besoins ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS besoins_insert ON public.besoins;
CREATE POLICY besoins_insert ON public.besoins FOR INSERT
  WITH CHECK (public.can_edit_festival(auth.uid(), festival_id));

DROP POLICY IF EXISTS besoins_update ON public.besoins;
CREATE POLICY besoins_update ON public.besoins FOR UPDATE
  USING (public.can_edit_festival(auth.uid(), festival_id));

-- ─── 7. RLS todos ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS todos_insert ON public.todos;
CREATE POLICY todos_insert ON public.todos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.festival_members
      WHERE festival_id = todos.festival_id
        AND user_id = auth.uid()
        AND role IN ('super_admin', 'admin', 'pole_manager', 'utilisateur')
    )
  );

DROP POLICY IF EXISTS todos_update ON public.todos;
CREATE POLICY todos_update ON public.todos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.festival_members
      WHERE festival_id = todos.festival_id
        AND user_id = auth.uid()
        AND role IN ('super_admin', 'admin', 'pole_manager', 'utilisateur')
    )
  );

DROP POLICY IF EXISTS todos_delete ON public.todos;
CREATE POLICY todos_delete ON public.todos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.festival_members
      WHERE festival_id = todos.festival_id
        AND user_id = auth.uid()
        AND role IN ('super_admin', 'admin', 'pole_manager')
    )
  );

-- ─── 8. RLS profiles ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_any_admin()
    OR EXISTS (
      SELECT 1
      FROM public.festival_members fm_caller
      JOIN public.festival_members fm_target
        ON fm_caller.festival_id = fm_target.festival_id
      WHERE fm_caller.user_id = auth.uid()
        AND fm_caller.role IN ('super_admin', 'admin', 'pole_manager')
        AND fm_target.user_id = profiles.id
    )
  );
