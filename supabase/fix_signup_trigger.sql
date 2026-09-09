-- Run this in the SQL Editor if Sign in says "Database error saving new user".
-- Replaces the profile-create trigger. Does not drop tables.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base text;
  uname text;
  suffix text;
BEGIN
  base := split_part(COALESCE(NEW.email, 'player'), '@', 1);
  base := regexp_replace(lower(base), '[^a-z0-9]', '', 'g');
  IF char_length(base) < 3 THEN
    base := 'player';
  END IF;
  IF char_length(base) > 12 THEN
    base := substr(base, 1, 12);
  END IF;
  suffix := substr(replace(NEW.id::text, '-', ''), 1, 6);
  uname := base || suffix;

  INSERT INTO public.profiles (id, username, avatar, email_hash)
  VALUES (
    NEW.id,
    uname,
    '🦊',
    CASE
      WHEN NEW.email IS NOT NULL THEN encode(extensions.digest(lower(NEW.email)::bytea, 'sha256'), 'hex')
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
