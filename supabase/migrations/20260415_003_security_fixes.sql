-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003 — Correctifs sécurité
-- Problèmes résolus :
--   F01 : Escalade de privilèges — INSERT INTO festival_members sans restriction
--         sur le rôle permettait à n'importe quel user de se donner le rôle 'admin'
--   F02 : Fuite de données — profiles_select exposait tous les emails à
--         tout utilisateur authentifié (RGPD)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── F01 : Restreindre l'auto-inscription à viewer uniquement ─────────────────
-- La politique précédente n'avait pas de WITH CHECK sur le rôle,
-- ce qui permettait user_id = auth.uid() avec role = 'admin'.
DROP POLICY IF EXISTS festival_members_insert_self ON public.festival_members;

CREATE POLICY festival_members_insert_self ON public.festival_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'viewer'        -- ← Seul 'viewer' est autorisé à la création
  );

-- ── F02 : Restreindre la visibilité des profils (emails) ─────────────────────
-- Avant : USING (true) → tous les emails visibles par tous les users authentifiés
-- Après : visible seulement si :
--   - c'est son propre profil
--   - OU il est admin global (is_any_admin())
--   - OU il partage au moins un festival avec cet utilisateur
DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Son propre profil
    id = auth.uid()
    OR
    -- Admin global : voit tout (nécessaire pour la page Administration)
    public.is_any_admin()
    OR
    -- Co-membre d'un festival : visibilité mutuelle entre membres du même festival
    EXISTS (
      SELECT 1
      FROM public.festival_members fm_caller
      JOIN public.festival_members fm_target
        ON fm_caller.festival_id = fm_target.festival_id
      WHERE fm_caller.user_id = auth.uid()
        AND fm_target.user_id = profiles.id
    )
  );

-- ── Vérification ─────────────────────────────────────────────────────────────
-- Après exécution, vérifier dans Supabase → Authentication → Policies :
--   • festival_members : policy "festival_members_insert_self" avec WITH CHECK (role='viewer')
--   • profiles : policy "profiles_select" avec la nouvelle USING clause
