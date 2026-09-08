-- Battleverse Phase 1 schema, RLS, and triggers.
-- Apply in the Supabase SQL editor (or `supabase db push`) before enabling the client.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.age_band AS ENUM ('6-8', '9-12', '13-16', '16plus');
CREATE TYPE public.difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.question_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.user_role AS ENUM ('player', 'admin');
CREATE TYPE public.battle_mode AS ENUM ('matchmaking', 'challenge');
CREATE TYPE public.battle_status AS ENUM ('waiting', 'active', 'complete', 'forfeit');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'queued_offline');
CREATE TYPE public.xp_source AS ENUM ('practice', 'battle', 'badge');
CREATE TYPE public.test_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username citext NOT NULL UNIQUE,
  avatar text NOT NULL DEFAULT '🦊',
  age_band public.age_band,
  discoverable boolean NOT NULL DEFAULT false,
  phone_hash text,
  email_hash text,
  role public.user_role NOT NULL DEFAULT 'player',
  xp integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  quizzes_completed integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  total_answers integer NOT NULL DEFAULT 0,
  parent_email text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

CREATE TABLE public.exam_types (
  id text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE public.subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  color text NOT NULL,
  description text NOT NULL
);

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
  exam_type_id text REFERENCES public.exam_types (id),
  name text NOT NULL
);

CREATE TABLE public.questions (
  id text PRIMARY KEY,
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text NOT NULL DEFAULT '',
  subject_id text NOT NULL REFERENCES public.subjects (id),
  topic_id uuid REFERENCES public.topics (id),
  exam_type_id text NOT NULL REFERENCES public.exam_types (id) DEFAULT 'casual',
  difficulty public.difficulty NOT NULL DEFAULT 'easy',
  age_band public.age_band NOT NULL,
  status public.question_status NOT NULL DEFAULT 'published',
  created_by uuid REFERENCES public.profiles (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT options_four CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4)
);

CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  exam_type_id text NOT NULL REFERENCES public.exam_types (id),
  subject_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 8,
  time_limit_s integer,
  pass_mark_pct integer,
  hints_allowed boolean NOT NULL DEFAULT true,
  offline_pack boolean NOT NULL DEFAULT false,
  status public.test_status NOT NULL DEFAULT 'draft',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.test_questions (
  test_id uuid NOT NULL REFERENCES public.tests (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  position integer NOT NULL,
  PRIMARY KEY (test_id, question_id)
);

CREATE TABLE public.attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions (id),
  test_id uuid REFERENCES public.tests (id),
  battle_id uuid,
  chosen_index integer,
  is_correct boolean,
  elapsed_ms integer,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode public.battle_mode NOT NULL DEFAULT 'matchmaking',
  subject_id text NOT NULL REFERENCES public.subjects (id),
  age_band public.age_band NOT NULL,
  status public.battle_status NOT NULL DEFAULT 'waiting',
  question_started_at timestamptz,
  current_index integer NOT NULL DEFAULT 0,
  host_clock timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_battle_fk
  FOREIGN KEY (battle_id) REFERENCES public.battles (id) ON DELETE SET NULL;

CREATE TABLE public.battle_players (
  battle_id uuid NOT NULL REFERENCES public.battles (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  connected boolean NOT NULL DEFAULT true,
  PRIMARY KEY (battle_id, user_id)
);

CREATE TABLE public.battle_questions (
  battle_id uuid NOT NULL REFERENCES public.battles (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions (id),
  position integer NOT NULL,
  PRIMARY KEY (battle_id, position)
);

CREATE TABLE public.battle_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  battle_id uuid NOT NULL REFERENCES public.battles (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subject_id text NOT NULL REFERENCES public.subjects (id),
  age_band public.age_band NOT NULL,
  status public.invite_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subject_id text NOT NULL REFERENCES public.subjects (id),
  age_band public.age_band NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.xp_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  source public.xp_source NOT NULL,
  amount integer NOT NULL,
  attempt_id uuid REFERENCES public.attempts (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.badges (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  description text NOT NULL,
  requirement text NOT NULL
);

CREATE TABLE public.user_badges (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges (id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE public.leaderboard_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  captured_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);

CREATE TABLE public.admin_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES public.profiles (id),
  action text NOT NULL,
  entity text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE VIEW public.public_profiles
  WITH (security_invoker = false)
  AS
  SELECT
    id,
    username,
    avatar,
    xp,
    level,
    age_band,
    discoverable
  FROM public.profiles;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY exam_types_read ON public.exam_types
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY subjects_read ON public.subjects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY topics_read ON public.topics
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY questions_read_published ON public.questions
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY tests_read_published ON public.tests
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY test_questions_read ON public.test_questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY badges_read ON public.badges
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY leaderboard_read ON public.leaderboard_snapshots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY attempts_own ON public.attempts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY xp_events_own ON public.xp_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_badges_own ON public.user_badges
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_badges_insert_own ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY battles_participant ON public.battles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.battle_players bp
      WHERE bp.battle_id = battles.id AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY battle_players_participant ON public.battle_players
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.battle_players me
      WHERE me.battle_id = battle_players.battle_id AND me.user_id = auth.uid()
    )
  );

CREATE POLICY battle_questions_participant ON public.battle_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.battle_players bp
      WHERE bp.battle_id = battle_questions.battle_id AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY battle_events_participant ON public.battle_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.battle_players bp
      WHERE bp.battle_id = battle_events.battle_id AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY invites_parties ON public.invites
  FOR ALL TO authenticated
  USING (auth.uid() = from_id OR auth.uid() = to_id)
  WITH CHECK (auth.uid() = from_id OR auth.uid() = to_id);

CREATE POLICY matchmaking_own ON public.matchmaking_queue
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY admin_audit_admin ON public.admin_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.subjects, public.exam_types, public.topics, public.badges TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.questions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subjects FROM anon, authenticated;
