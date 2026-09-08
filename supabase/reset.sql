-- Wipe Battleverse public objects so 0001_init.sql can run again.
-- Safe to run if a previous init failed halfway (e.g. "type age_band already exists").
-- Does NOT delete auth.users.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();

DROP VIEW IF EXISTS public.public_profiles;

DROP TABLE IF EXISTS public.admin_audit CASCADE;
DROP TABLE IF EXISTS public.leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.xp_events CASCADE;
DROP TABLE IF EXISTS public.matchmaking_queue CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.battle_events CASCADE;
DROP TABLE IF EXISTS public.battle_questions CASCADE;
DROP TABLE IF EXISTS public.battle_players CASCADE;
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.battles CASCADE;
DROP TABLE IF EXISTS public.test_questions CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.exam_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.test_status;
DROP TYPE IF EXISTS public.xp_source;
DROP TYPE IF EXISTS public.invite_status;
DROP TYPE IF EXISTS public.battle_status;
DROP TYPE IF EXISTS public.battle_mode;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.question_status;
DROP TYPE IF EXISTS public.difficulty;
DROP TYPE IF EXISTS public.age_band;
