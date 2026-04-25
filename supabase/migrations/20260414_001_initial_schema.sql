-- ============================================================================
-- NOX LOGISTIQUE — SCHÉMA INITIAL
-- Phase 0 : Fondations multi-tenant, auth, besoins, RLS, realtime
-- ============================================================================
--
-- Ce fichier est à exécuter dans l'éditeur SQL de Supabase.
-- Ouvre ton projet Supabase → SQL Editor → New query → colle ce fichier → Run.
--
-- Design multi-tenant : chaque donnée est rattachée à un `festival_id`.
-- RLS isole automatiquement les données entre festivals.
-- ============================================================================


-- ============================================================================
-- 1. TYPES ENUM
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'pole_manager', 'viewer');
CREATE TYPE pole_type AS ENUM ('Bénévole', 'Restauration', 'Artiste', 'Sécurité', 'Logistique');
CREATE TYPE besoin_statut AS ENUM ('En attente', 'Validé', 'Annulé');
CREATE TYPE yes_no AS ENUM ('Oui', 'Non');


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Table festivals (tenant root)
CREATE TABLE festivals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table profiles (extension de auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table festival_members (user ↔ festival, avec rôle)
CREATE TABLE festival_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id  UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'viewer',
  pole         pole_type,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (festival_id, user_id)
);

CREATE INDEX idx_festival_members_user ON festival_members(user_id);
CREATE INDEX idx_festival_members_festival ON festival_members(festival_id);

-- Table besoins (données métier principales)
CREATE TABLE besoins (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id        UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  pole               pole_type NOT NULL,
  date               DATE NOT NULL,
  designation        TEXT NOT NULL,
  quantite           INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  caracteristique    TEXT,
  usage              TEXT,
  statut             besoin_statut NOT NULL DEFAULT 'En attente',
  longueur           TEXT,
  largeur            TEXT,
  hauteur            TEXT,
  electricite        yes_no NOT NULL DEFAULT 'Non',
  electricite_detail TEXT,
  eau                yes_no NOT NULL DEFAULT 'Non',
  eau_detail         TEXT,
  created_by         UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_besoins_festival ON besoins(festival_id);
CREATE INDEX idx_besoins_pole ON besoins(festival_id, pole);
CREATE INDEX idx_besoins_statut ON besoins(festival_id, statut);


-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_besoins_updated_at
  BEFORE UPDATE ON besoins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile when new auth.user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_festival_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- Auto-join default Nox festival as viewer
  SELECT id INTO default_festival_id FROM festivals WHERE slug = 'nox-2026' LIMIT 1;
  IF default_festival_id IS NOT NULL THEN
    INSERT INTO public.festival_members (festival_id, user_id, role)
    VALUES (default_festival_id, NEW.id, 'viewer');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- 4. HELPER FUNCTIONS POUR RLS
-- ============================================================================

-- Retourne tous les festival_id où l'utilisateur est membre
CREATE OR REPLACE FUNCTION user_festival_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT festival_id FROM festival_members WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est admin d'un festival
CREATE OR REPLACE FUNCTION is_festival_admin(uid UUID, fid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM festival_members
    WHERE user_id = uid AND festival_id = fid AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est admin ou pole_manager d'un festival
CREATE OR REPLACE FUNCTION can_edit_festival(uid UUID, fid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM festival_members
    WHERE user_id = uid AND festival_id = fid
      AND role IN ('admin', 'pole_manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Activation RLS
ALTER TABLE festivals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE besoins           ENABLE ROW LEVEL SECURITY;


-- ─── FESTIVALS ─────────────────────────────────────────────────────────────

-- Lecture : seulement les festivals où l'utilisateur est membre
CREATE POLICY festivals_select ON festivals
  FOR SELECT
  USING (id IN (SELECT user_festival_ids(auth.uid())));

-- Création : tout utilisateur authentifié peut créer un festival
CREATE POLICY festivals_insert ON festivals
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Modification : admins uniquement
CREATE POLICY festivals_update ON festivals
  FOR UPDATE
  USING (is_festival_admin(auth.uid(), id));

-- Suppression : admins uniquement
CREATE POLICY festivals_delete ON festivals
  FOR DELETE
  USING (is_festival_admin(auth.uid(), id));


-- ─── PROFILES ──────────────────────────────────────────────────────────────

-- Lecture : tout utilisateur authentifié peut voir les profils
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Modification : chacun modifie son propre profil
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = auth.uid());


-- ─── FESTIVAL_MEMBERS ──────────────────────────────────────────────────────

-- Lecture : membres du même festival
CREATE POLICY festival_members_select ON festival_members
  FOR SELECT
  USING (festival_id IN (SELECT user_festival_ids(auth.uid())));

-- Auto-inscription : l'utilisateur peut s'ajouter lui-même à un festival
-- (utilisé par le trigger handle_new_user)
CREATE POLICY festival_members_insert_self ON festival_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Gestion des membres : admins uniquement
CREATE POLICY festival_members_admin_all ON festival_members
  FOR ALL
  USING (is_festival_admin(auth.uid(), festival_id));


-- ─── BESOINS ───────────────────────────────────────────────────────────────

-- Lecture : tous les membres du festival
CREATE POLICY besoins_select ON besoins
  FOR SELECT
  USING (festival_id IN (SELECT user_festival_ids(auth.uid())));

-- Création : admins et pole_managers
CREATE POLICY besoins_insert ON besoins
  FOR INSERT
  WITH CHECK (can_edit_festival(auth.uid(), festival_id));

-- Modification : admins et pole_managers
CREATE POLICY besoins_update ON besoins
  FOR UPDATE
  USING (can_edit_festival(auth.uid(), festival_id));

-- Suppression : admins uniquement
CREATE POLICY besoins_delete ON besoins
  FOR DELETE
  USING (is_festival_admin(auth.uid(), festival_id));


-- ============================================================================
-- 6. REALTIME (sync multi-users)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE besoins;
ALTER PUBLICATION supabase_realtime ADD TABLE festival_members;


-- ============================================================================
-- 7. SEED : festival par défaut + données d'exemple
-- ============================================================================

-- Festival Nox 2026 (UUID fixe pour référence stable)
INSERT INTO festivals (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nox Festival 2026', 'nox-2026')
ON CONFLICT (slug) DO NOTHING;

-- Données d'exemple (les mêmes que SAMPLE_DATA dans l'app)
INSERT INTO besoins (festival_id, pole, date, designation, quantite, caracteristique, usage, statut, longueur, largeur, hauteur, electricite, electricite_detail, eau, eau_detail) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bénévole',    '2026-04-10', 'Talkies-walkies',            20,  'Portée 5km minimum',            'Communication entre les équipes sur le site', 'En attente', NULL, NULL, NULL, 'Non', NULL, 'Non', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Restauration','2026-04-09', 'Tables pliantes 180cm',      15,  'Résistantes, pieds réglables',  'Service restauration zone VIP',               'Validé',     '180','75','74','Oui', '2 prises 220V par table pour réchauds', 'Oui', 'Point d''eau à proximité pour lavage'),
  ('00000000-0000-0000-0000-000000000001', 'Artiste',     '2026-04-08', 'Loges climatisées',          4,   'Algeco 20m² avec clim réversible','Loges artistes backstage',                  'En attente', '600','300','280','Oui', '32A triphasé pour climatisation', 'Non', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Sécurité',    '2026-04-07', 'Barrières Vauban',           120, 'Acier galvanisé 2m',            'Délimitation fosse et accès scènes',          'Validé',     '200','5','110','Non', NULL, 'Non', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Logistique',  '2026-04-06', 'Groupe électrogène 100kVA',  2,   'Diesel, insonorisé',            'Alimentation scène principale et son',        'Annulé',     '250','120','150','Oui', 'Raccordement TGBT principal', 'Non', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Bénévole',    '2026-04-11', 'Gilets haute visibilité',    50,  'Jaune fluo, taille unique',     'Identification des bénévoles sur site',       'En attente', NULL, NULL, NULL, 'Non', NULL, 'Non', NULL)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 8. APRÈS EXÉCUTION : créer le premier admin
-- ============================================================================
--
-- Après avoir lancé ce script :
-- 1. Crée ton compte via l'app (signup email + password)
-- 2. Dans Supabase → Table Editor → festival_members
-- 3. Trouve ta ligne et change `role` de 'viewer' à 'admin'
-- 4. Optionnel : duplique pour créer d'autres admins
-- ============================================================================
