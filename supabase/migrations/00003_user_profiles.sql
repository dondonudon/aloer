-- Migration: Create public profiles table for user display names.
-- The auth.users table lives in the protected auth schema and cannot be
-- queried directly by the PostgREST API layer.  This table provides a
-- public, RLS-gated mirror of the user's display name so that server
-- actions can join it when returning record details.

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE public.profiles (
  id        uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email     text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may read profile names.
-- No writes are allowed through the PostgREST layer; the sync
-- trigger below is the only writer.
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- BACKFILL EXISTING USERS
-- ============================================================

INSERT INTO public.profiles (id, full_name, email)
SELECT
  id,
  COALESCE(
    NULLIF(raw_user_meta_data->>'full_name', ''),
    NULLIF(raw_user_meta_data->>'name', ''),
    split_part(email, '@', 1),
    ''
  ),
  COALESCE(email, '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SYNC TRIGGER
-- ============================================================

/**
 * Keeps public.profiles in sync whenever a user is created or
 * their metadata is updated (e.g. after OAuth sign-in).
 * SECURITY DEFINER runs as the function owner (postgres) so it
 * can read auth.users and write public.profiles even when called
 * from the auth trigger context.
 */
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1),
      ''
    ),
    COALESCE(NEW.email, ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    email      = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();
