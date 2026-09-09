-- Phase 2: practice attempt sync + session finish.
-- Run in the SQL Editor AFTER 0001_init.sql (and seed).

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subject_id text NOT NULL REFERENCES public.subjects (id),
  correct integer NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_sessions_own ON public.practice_sessions;
CREATE POLICY practice_sessions_own ON public.practice_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.practice_level(p_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_xp >= 4000 THEN 8
    WHEN p_xp >= 2500 THEN 7
    WHEN p_xp >= 1500 THEN 6
    WHEN p_xp >= 1000 THEN 5
    WHEN p_xp >= 600 THEN 4
    WHEN p_xp >= 300 THEN 3
    WHEN p_xp >= 100 THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.submit_attempt(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  q public.questions%ROWTYPE;
  attempt_id uuid;
  chosen int;
  time_left int;
  ok boolean;
  xp int;
  existing public.attempts%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  attempt_id := (payload->>'id')::uuid;
  SELECT * INTO existing FROM public.attempts WHERE id = attempt_id;
  IF FOUND THEN
    SELECT * INTO q FROM public.questions WHERE id = existing.question_id;
    RETURN jsonb_build_object(
      'is_correct', existing.is_correct,
      'xp', existing.xp_awarded,
      'explanation', COALESCE(q.explanation, ''),
      'duplicate', true
    );
  END IF;

  SELECT * INTO q
  FROM public.questions
  WHERE id = payload->>'question_id' AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found';
  END IF;

  chosen := COALESCE((payload->>'chosen_index')::int, -1);
  time_left := GREATEST(0, COALESCE((payload->>'time_left')::int, 0));
  ok := chosen = q.correct_index;
  xp := CASE WHEN ok THEN 10 + (time_left * 2) ELSE 0 END;

  INSERT INTO public.attempts (
    id, user_id, question_id, chosen_index, is_correct, elapsed_ms, xp_awarded
  ) VALUES (
    attempt_id,
    uid,
    q.id,
    chosen,
    ok,
    GREATEST(0, (15 - time_left) * 1000),
    xp
  );

  INSERT INTO public.xp_events (user_id, source, amount, attempt_id)
  VALUES (uid, 'practice', xp, attempt_id);

  UPDATE public.profiles
  SET
    xp = profiles.xp + xp,
    coins = profiles.coins + CASE WHEN xp > 0 THEN FLOOR(xp / 5.0) ELSE 0 END,
    correct_answers = profiles.correct_answers + CASE WHEN ok THEN 1 ELSE 0 END,
    total_answers = profiles.total_answers + 1,
    level = public.practice_level(profiles.xp + xp)
  WHERE id = uid;

  RETURN jsonb_build_object(
    'is_correct', ok,
    'xp', xp,
    'explanation', q.explanation,
    'duplicate', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_practice(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  session_id uuid;
  subj text;
  correct int;
  total int;
  inserted int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  session_id := (payload->>'id')::uuid;
  subj := payload->>'subject_id';
  correct := COALESCE((payload->>'correct')::int, 0);
  total := COALESCE((payload->>'total')::int, 0);

  INSERT INTO public.practice_sessions (id, user_id, subject_id, correct, total)
  VALUES (session_id, uid, subj, correct, total)
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  UPDATE public.profiles
  SET quizzes_completed = quizzes_completed + 1
  WHERE id = uid;

  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (uid, 'first-win')
  ON CONFLICT DO NOTHING;

  IF total > 0 AND correct = total THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (uid, 'genius')
    ON CONFLICT DO NOTHING;

    IF subj = 'math' THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (uid, 'math-whiz') ON CONFLICT DO NOTHING;
    ELSIF subj = 'tech' THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (uid, 'tech-guru') ON CONFLICT DO NOTHING;
    ELSIF subj = 'ai' THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (uid, 'ai-master') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'duplicate', false);
END;
$$;

GRANT SELECT ON public.questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.practice_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_attempt(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_practice(jsonb) TO authenticated;
