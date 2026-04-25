-- ============================================================================
-- NOX LOGISTIQUE — Fix trigger handle_new_user
-- Rend l'auto-join festival non-bloquant pour ne pas empêcher la création
-- de compte via inviteUserByEmail.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_festival_id UUID;
BEGIN
  -- 1. Créer (ou mettre à jour) le profil — critique
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);

  -- 2. Auto-join festival par défaut — optionnel, ne doit pas bloquer
  BEGIN
    SELECT id INTO default_festival_id
    FROM public.festivals
    WHERE slug = 'nox-2026'
    LIMIT 1;

    IF default_festival_id IS NOT NULL THEN
      INSERT INTO public.festival_members (festival_id, user_id, role)
      VALUES (default_festival_id, NEW.id, 'viewer')
      ON CONFLICT (festival_id, user_id) DO NOTHING;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Non-bloquant : on log mais on ne fait pas échouer la création du compte
    RAISE WARNING '[handle_new_user] auto-join skipped for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
