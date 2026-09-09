-- Phase 6: published exam papers for learners. Run AFTER 0005_admin_rpcs.sql.
-- Players may list/take published tests only. Draft composition stays admin-only.

DROP POLICY IF EXISTS test_questions_read ON public.test_questions;
CREATE POLICY test_questions_read ON public.test_questions
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id AND t.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.list_published_tests()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(paper ORDER BY updated_at DESC), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'exam_type_id', t.exam_type_id,
      'subject_ids', t.subject_ids,
      'question_count', t.question_count,
      'time_limit_s', t.time_limit_s,
      'pass_mark_pct', t.pass_mark_pct,
      'hints_allowed', t.hints_allowed,
      'offline_pack', t.offline_pack,
      'status', t.status,
      'updated_at', t.updated_at,
      'question_ids', COALESCE((
        SELECT jsonb_agg(tq.question_id ORDER BY tq.position)
        FROM public.test_questions tq
        JOIN public.questions q ON q.id = tq.question_id AND q.status = 'published'
        WHERE tq.test_id = t.id
      ), '[]'::jsonb)
    ) AS paper,
    t.updated_at
    FROM public.tests t
    WHERE t.status = 'published'
  ) x;
$$;

CREATE OR REPLACE FUNCTION public.get_exam_paper(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'exam_type_id', t.exam_type_id,
    'subject_ids', t.subject_ids,
    'question_count', t.question_count,
    'time_limit_s', t.time_limit_s,
    'pass_mark_pct', t.pass_mark_pct,
    'hints_allowed', t.hints_allowed,
    'offline_pack', t.offline_pack,
    'status', t.status,
    'updated_at', t.updated_at,
    'question_ids', COALESCE((
      SELECT jsonb_agg(tq.question_id ORDER BY tq.position)
      FROM public.test_questions tq
      JOIN public.questions q ON q.id = tq.question_id AND q.status = 'published'
      WHERE tq.test_id = t.id
    ), '[]'::jsonb),
    'questions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'prompt', q.prompt,
          'options', q.options,
          'correct_index', q.correct_index,
          'explanation', q.explanation,
          'subject_id', q.subject_id,
          'difficulty', q.difficulty,
          'age_band', q.age_band
        )
        ORDER BY tq.position
      )
      FROM public.test_questions tq
      JOIN public.questions q ON q.id = tq.question_id AND q.status = 'published'
      WHERE tq.test_id = t.id
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.tests t
  WHERE t.id = p_id AND t.status = 'published';

  RETURN result;
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
  paper uuid;
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

  paper := NULLIF(payload->>'test_id', '')::uuid;
  IF paper IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.tests t WHERE t.id = paper AND t.status = 'published'
  ) THEN
    paper := NULL;
  END IF;

  chosen := COALESCE((payload->>'chosen_index')::int, -1);
  time_left := GREATEST(0, COALESCE((payload->>'time_left')::int, 0));
  ok := chosen = q.correct_index;
  xp := CASE WHEN ok THEN 10 + (time_left * 2) ELSE 0 END;

  INSERT INTO public.attempts (
    id, user_id, question_id, test_id, chosen_index, is_correct, elapsed_ms, xp_awarded
  ) VALUES (
    attempt_id,
    uid,
    q.id,
    paper,
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

GRANT EXECUTE ON FUNCTION public.list_published_tests() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_paper(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_attempt(jsonb) TO authenticated;

-- Demo JAMB / WAEC papers from published seed items so learners can take a mock immediately.
DO $$
DECLARE
  jamb_id uuid := 'a1111111-1111-4111-8111-111111111111';
  waec_id uuid := 'a2222222-2222-4222-8222-222222222222';
  jamb_n int;
  waec_n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tests WHERE id = jamb_id) THEN
    INSERT INTO public.tests (
      id, title, exam_type_id, subject_ids, question_count, time_limit_s,
      pass_mark_pct, hints_allowed, offline_pack, status
    ) VALUES (
      jamb_id, 'JAMB Practice Paper', 'jamb', '["math"]'::jsonb, 8, 600,
      50, false, true, 'published'
    );
    INSERT INTO public.test_questions (test_id, question_id, position)
    SELECT jamb_id, q.id, (row_number() OVER (ORDER BY q.id) - 1)::int
    FROM (
      SELECT id FROM public.questions
      WHERE status = 'published' AND subject_id = 'math'
      ORDER BY id
      LIMIT 8
    ) q;
    SELECT count(*) INTO jamb_n FROM public.test_questions WHERE test_id = jamb_id;
    IF jamb_n = 0 THEN
      DELETE FROM public.tests WHERE id = jamb_id;
    ELSE
      UPDATE public.tests SET question_count = jamb_n WHERE id = jamb_id;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tests WHERE id = waec_id) THEN
    INSERT INTO public.tests (
      id, title, exam_type_id, subject_ids, question_count, time_limit_s,
      pass_mark_pct, hints_allowed, offline_pack, status
    ) VALUES (
      waec_id, 'WAEC Practice Paper', 'waec', '["tech"]'::jsonb, 8, 600,
      50, false, true, 'published'
    );
    INSERT INTO public.test_questions (test_id, question_id, position)
    SELECT waec_id, q.id, (row_number() OVER (ORDER BY q.id) - 1)::int
    FROM (
      SELECT id FROM public.questions
      WHERE status = 'published' AND subject_id = 'tech'
      ORDER BY id
      LIMIT 8
    ) q;
    SELECT count(*) INTO waec_n FROM public.test_questions WHERE test_id = waec_id;
    IF waec_n = 0 THEN
      DELETE FROM public.tests WHERE id = waec_id;
    ELSE
      UPDATE public.tests SET question_count = waec_n WHERE id = waec_id;
    END IF;
  END IF;
END $$;
