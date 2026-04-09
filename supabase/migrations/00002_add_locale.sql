-- Add locale preference to user_roles (mirrors the theme column pattern)
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS locale text CHECK (locale IN ('en', 'id'));
