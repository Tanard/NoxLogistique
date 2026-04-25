-- ============================================================================
-- NOX LOGISTIQUE — GESTION UTILISATEURS (ADMIN)
-- Phase 2 : email dans profiles, RLS admin global, helper is_any_admin()
-- ============================================================================
--
-- À exécuter dans Supabase → SQL Editor → New query → colle ce fichier → Run
-- APRÈS avoir exécuté le script 001_initial_schema.sql
-- ============================================================================


-- ============================================================================
-- 1. AJOUT EMAIL DANS PROFILES
-- ============================================================================

-- Ajoute la colonne email (nullable pour compatibilité avec les profils existants)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Met à jour le trigger handle_new_user pour stocker l'email dès l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_festival_id UUID;
BEGIN
  -- Crée (ou met à jour) le profil avec email
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Auto-join festival par défaut en tant que viewer
  SELECT id INTO default_festival_id FROM festivals WHERE slug = 'nox-2026' LIMIT 1;
  IF default_festival_id IS NOT NULL THEN
    INSERT INTO public.festival_members (festival_id, user_id, role)
    VALUES (default_festival_id, NEW.id, 'viewer')
    ON CONFLICT (festival_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill : récupère les emails des utilisateurs déjà existants
-- (fonctionne car ce script tourne en tant que postgres dans le SQL Editor)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;


-- ============================================================================
-- 2. FONCTION HELPER : is_any_admin()
-- ============================================================================

-- Vérifie si l'utilisateur courant est admin dans N'IMPORTE QUEL festival
-- SECURITY DEFINER = tourne en tant que postgres → bypass RLS → pas de récursion infinie
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.festival_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 3. MISE À JOUR RLS — FESTIVAL_MEMBERS
-- ============================================================================

-- Supprime l'ancienne politique SELECT (trop restrictive pour les admins globaux)
DROP POLICY IF EXISTS festival_members_select ON public.festival_members;

-- Nouvelle politique SELECT : ses propres festivals OU admin global
CREATE POLICY festival_members_select ON public.festival_members
  FOR SELECT
  USING (
    festival_id IN (SELECT user_festival_ids(auth.uid()))
    OR public.is_any_admin()
  );

-- Politique INSERT pour les admins globaux (ajouter n'importe quel user à n'importe quel festival)
-- La politique insert_self existante couvre le cas trigger ; celle-ci couvre les admins
DROP POLICY IF EXISTS festival_members_admin_insert ON public.festival_members;
CREATE POLICY festival_members_admin_insert ON public.festival_members
  FOR INSERT
  WITH CHECK (public.is_any_admin());

-- Politique UPDATE pour les admins globaux (changer le rôle de n'importe quel user)
DROP POLICY IF EXISTS festival_members_admin_update ON public.festival_members;
CREATE POLICY festival_members_admin_update ON public.festival_members
  FOR UPDATE
  USING (public.is_any_admin());

-- Politique DELETE pour les admins globaux (retirer n'importe quel user d'un festival)
DROP POLICY IF EXISTS festival_members_admin_delete ON public.festival_members;
CREATE POLICY festival_members_admin_delete ON public.festival_members
  FOR DELETE
  USING (
    public.is_any_admin()
    OR is_festival_admin(auth.uid(), festival_id)
  );


-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- ✅ La colonne email est ajoutée à profiles
-- ✅ Les emails existants sont backfillés
-- ✅ Les nouveaux utilisateurs auront leur email dans profiles dès l'inscription
-- ✅ Un admin peut voir TOUS les festival_members (tous festivals)
-- ✅ Un admin peut ajouter/modifier/supprimer des membres dans tous les festivals
-- ============================================================================
