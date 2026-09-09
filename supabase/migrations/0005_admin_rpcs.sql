-- Phase 5: admin CMS RPCs. Run AFTER 0001_init.sql (and 0002 if Practice is live).
-- Player JWTs may call these functions but every entrypoint raises unless role = admin.

CREATE OR REPLACE FUNCTION public.prevent_role_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ) THEN
      RAISE EXCEPTION 'cannot change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_upgrade();

CREATE OR REPLACE FUNCTION public.require_admin()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  r public.user_role;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  SELECT role INTO r FROM public.profiles WHERE id = uid;
  IF r IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'not an admin';
  END IF;
  RETURN uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_write_audit(
  p_actor uuid,
  p_action text,
  p_entity text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit (actor_id, action, entity, payload)
  VALUES (p_actor, p_action, p_entity, COALESCE(p_payload, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_question_json(q public.questions)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', q.id,
    'prompt', q.prompt,
    'options', q.options,
    'correct_index', q.correct_index,
    'explanation', q.explanation,
    'subject_id', q.subject_id,
    'topic_id', q.topic_id,
    'exam_type_id', q.exam_type_id,
    'difficulty', q.difficulty,
    'age_band', q.age_band,
    'status', q.status,
    'created_by', q.created_by,
    'updated_at', q.updated_at
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_ensure_topic(
  p_subject_id text,
  p_exam_type_id text,
  p_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  cleaned text := trim(COALESCE(p_name, ''));
BEGIN
  IF cleaned = '' THEN
    RETURN NULL;
  END IF;
  SELECT id INTO tid
  FROM public.topics
  WHERE subject_id = p_subject_id AND name = cleaned
  LIMIT 1;
  IF tid IS NOT NULL THEN
    RETURN tid;
  END IF;
  INSERT INTO public.topics (subject_id, exam_type_id, name)
  VALUES (p_subject_id, NULLIF(p_exam_type_id, ''), cleaned)
  RETURNING id INTO tid;
  RETURN tid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_question(p_question jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  qid text;
  opts jsonb;
  created public.questions%ROWTYPE;
  topic_name text;
  topic uuid;
BEGIN
  qid := NULLIF(trim(COALESCE(p_question->>'id', '')), '');
  IF qid IS NULL THEN
    qid := 'q_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  ELSIF qid !~ '^[a-zA-Z0-9_-]{1,40}$' THEN
    RAISE EXCEPTION 'invalid question id';
  END IF;

  IF jsonb_typeof(p_question->'options') = 'array' THEN
    opts := p_question->'options';
  ELSE
    opts := jsonb_build_array(
      p_question->>'option_a',
      p_question->>'option_b',
      p_question->>'option_c',
      p_question->>'option_d'
    );
  END IF;

  IF jsonb_array_length(opts) <> 4 THEN
    RAISE EXCEPTION 'need four options';
  END IF;
  IF COALESCE(p_question->>'prompt', '') = '' THEN
    RAISE EXCEPTION 'missing prompt';
  END IF;
  IF (p_question->>'correct_index')::int NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'correct_index must be 0-3';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = p_question->>'subject_id') THEN
    RAISE EXCEPTION 'unknown subject';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exam_types
    WHERE id = COALESCE(NULLIF(p_question->>'exam_type_id', ''), 'casual')
  ) THEN
    RAISE EXCEPTION 'unknown exam type';
  END IF;

  topic_name := NULLIF(trim(COALESCE(p_question->>'topic', '')), '');
  topic := NULL;
  IF p_question ? 'topic_id' AND NULLIF(p_question->>'topic_id', '') IS NOT NULL THEN
    topic := (p_question->>'topic_id')::uuid;
  ELSIF topic_name IS NOT NULL THEN
    topic := public.admin_ensure_topic(
      p_question->>'subject_id',
      COALESCE(NULLIF(p_question->>'exam_type_id', ''), 'casual'),
      topic_name
    );
  END IF;

  INSERT INTO public.questions (
    id, prompt, options, correct_index, explanation,
    subject_id, topic_id, exam_type_id, difficulty, age_band, status, created_by
  ) VALUES (
    qid,
    p_question->>'prompt',
    opts,
    (p_question->>'correct_index')::int,
    COALESCE(p_question->>'explanation', ''),
    p_question->>'subject_id',
    topic,
    COALESCE(NULLIF(p_question->>'exam_type_id', ''), 'casual'),
    COALESCE((p_question->>'difficulty')::public.difficulty, 'easy'),
    (p_question->>'age_band')::public.age_band,
    COALESCE((p_question->>'status')::public.question_status, 'draft'),
    uid
  )
  ON CONFLICT (id) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    options = EXCLUDED.options,
    correct_index = EXCLUDED.correct_index,
    explanation = EXCLUDED.explanation,
    subject_id = EXCLUDED.subject_id,
    topic_id = COALESCE(EXCLUDED.topic_id, public.questions.topic_id),
    exam_type_id = EXCLUDED.exam_type_id,
    difficulty = EXCLUDED.difficulty,
    age_band = EXCLUDED.age_band,
    status = EXCLUDED.status
  RETURNING * INTO created;

  PERFORM public.admin_write_audit(uid, 'upsert_question', 'question', jsonb_build_object('id', created.id, 'status', created.status));
  RETURN public.admin_question_json(created);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_question_status(p_id text, p_status public.question_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  created public.questions%ROWTYPE;
BEGIN
  UPDATE public.questions SET status = p_status WHERE id = p_id RETURNING * INTO created;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found';
  END IF;
  PERFORM public.admin_write_audit(uid, 'set_question_status', 'question', jsonb_build_object('id', p_id, 'status', p_status));
  RETURN public.admin_question_json(created);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_questions(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  result jsonb;
BEGIN
  PERFORM uid;
  SELECT COALESCE(jsonb_agg(public.admin_question_json(q) ORDER BY q.updated_at DESC), '[]'::jsonb)
  INTO result
  FROM public.questions q
  WHERE (NULLIF(p_filters->>'subject_id', '') IS NULL OR q.subject_id = p_filters->>'subject_id')
    AND (NULLIF(p_filters->>'exam_type_id', '') IS NULL OR q.exam_type_id = p_filters->>'exam_type_id')
    AND (NULLIF(p_filters->>'difficulty', '') IS NULL OR q.difficulty::text = p_filters->>'difficulty')
    AND (NULLIF(p_filters->>'age_band', '') IS NULL OR q.age_band::text = p_filters->>'age_band')
    AND (NULLIF(p_filters->>'status', '') IS NULL OR q.status::text = p_filters->>'status')
    AND (
      NULLIF(p_filters->>'q', '') IS NULL
      OR q.prompt ILIKE '%' || (p_filters->>'q') || '%'
      OR q.id ILIKE '%' || (p_filters->>'q') || '%'
    );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_questions(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  item jsonb;
  i int := 0;
  errors jsonb := '[]'::jsonb;
  imported int := 0;
  qid text;
  opts jsonb;
  topic uuid;
BEGIN
  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'rows must be a JSON array';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    i := i + 1;
    BEGIN
      IF COALESCE(item->>'prompt', '') = '' THEN
        RAISE EXCEPTION 'missing prompt';
      END IF;
      IF jsonb_typeof(item->'options') = 'array' THEN
        opts := item->'options';
      ELSE
        opts := jsonb_build_array(item->>'option_a', item->>'option_b', item->>'option_c', item->>'option_d');
      END IF;
      IF jsonb_array_length(opts) <> 4
        OR COALESCE(opts->>0, '') = ''
        OR COALESCE(opts->>1, '') = ''
        OR COALESCE(opts->>2, '') = ''
        OR COALESCE(opts->>3, '') = '' THEN
        RAISE EXCEPTION 'need four options';
      END IF;
      IF (item->>'correct_index')::int NOT BETWEEN 0 AND 3 THEN
        RAISE EXCEPTION 'correct_index must be 0-3';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = item->>'subject')
        AND NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = item->>'subject_id') THEN
        RAISE EXCEPTION 'unknown subject';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.exam_types
        WHERE id = COALESCE(NULLIF(item->>'exam_type', ''), NULLIF(item->>'exam_type_id', ''), 'casual')
      ) THEN
        RAISE EXCEPTION 'unknown exam type';
      END IF;
      IF NULLIF(item->>'age_band', '') IS NULL THEN
        RAISE EXCEPTION 'missing age_band';
      END IF;
      PERFORM (item->>'age_band')::public.age_band;
      PERFORM COALESCE(NULLIF(item->>'difficulty', ''), 'easy')::public.difficulty;
    EXCEPTION WHEN OTHERS THEN
      errors := errors || jsonb_build_array(jsonb_build_object('row', i, 'message', SQLERRM));
    END;
  END LOOP;

  IF jsonb_array_length(errors) > 0 THEN
    RETURN jsonb_build_object('imported', 0, 'errors', errors);
  END IF;

  BEGIN
    i := 0;
    FOR item IN SELECT value FROM jsonb_array_elements(p_rows)
    LOOP
      i := i + 1;
      qid := NULLIF(trim(COALESCE(item->>'id', '')), '');
      IF qid IS NULL THEN
        qid := 'q_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      END IF;
      IF jsonb_typeof(item->'options') = 'array' THEN
        opts := item->'options';
      ELSE
        opts := jsonb_build_array(item->>'option_a', item->>'option_b', item->>'option_c', item->>'option_d');
      END IF;
      topic := public.admin_ensure_topic(
        COALESCE(item->>'subject_id', item->>'subject'),
        COALESCE(NULLIF(item->>'exam_type', ''), NULLIF(item->>'exam_type_id', ''), 'casual'),
        COALESCE(item->>'topic', '')
      );
      INSERT INTO public.questions (
        id, prompt, options, correct_index, explanation,
        subject_id, topic_id, exam_type_id, difficulty, age_band, status, created_by
      ) VALUES (
        qid,
        item->>'prompt',
        opts,
        (item->>'correct_index')::int,
        COALESCE(item->>'explanation', ''),
        COALESCE(item->>'subject_id', item->>'subject'),
        topic,
        COALESCE(NULLIF(item->>'exam_type', ''), NULLIF(item->>'exam_type_id', ''), 'casual'),
        COALESCE((item->>'difficulty')::public.difficulty, 'easy'),
        (item->>'age_band')::public.age_band,
        COALESCE((item->>'status')::public.question_status, 'draft'),
        uid
      )
      ON CONFLICT (id) DO UPDATE SET
        prompt = EXCLUDED.prompt,
        options = EXCLUDED.options,
        correct_index = EXCLUDED.correct_index,
        explanation = EXCLUDED.explanation,
        subject_id = EXCLUDED.subject_id,
        topic_id = COALESCE(EXCLUDED.topic_id, public.questions.topic_id),
        exam_type_id = EXCLUDED.exam_type_id,
        difficulty = EXCLUDED.difficulty,
        age_band = EXCLUDED.age_band,
        status = EXCLUDED.status;
      imported := imported + 1;
    END LOOP;

    PERFORM public.admin_write_audit(uid, 'import_questions', 'question', jsonb_build_object('imported', imported));
    RETURN jsonb_build_object('imported', imported, 'errors', '[]'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'imported', 0,
      'errors', jsonb_build_array(jsonb_build_object('row', GREATEST(i, 1), 'message', SQLERRM))
    );
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_tests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  result jsonb;
BEGIN
  PERFORM uid;
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
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
          WHERE tq.test_id = t.id
        ), '[]'::jsonb)
      )
      ORDER BY t.updated_at DESC
    ),
    '[]'::jsonb
  )
  INTO result
  FROM public.tests t;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_test(p_test jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  tid uuid;
  qid text;
  pos int := 0;
  ids jsonb;
BEGIN
  IF COALESCE(p_test->>'title', '') = '' THEN
    RAISE EXCEPTION 'missing title';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exam_types
    WHERE id = COALESCE(NULLIF(p_test->>'exam_type_id', ''), 'custom')
  ) THEN
    RAISE EXCEPTION 'unknown exam type';
  END IF;

  tid := NULLIF(p_test->>'id', '')::uuid;

  IF tid IS NULL THEN
    INSERT INTO public.tests (
      title, exam_type_id, subject_ids, question_count, time_limit_s,
      pass_mark_pct, hints_allowed, offline_pack, status
    ) VALUES (
      p_test->>'title',
      COALESCE(NULLIF(p_test->>'exam_type_id', ''), 'custom'),
      COALESCE(p_test->'subject_ids', '[]'::jsonb),
      COALESCE((p_test->>'question_count')::int, 8),
      NULLIF(p_test->>'time_limit_s', '')::int,
      NULLIF(p_test->>'pass_mark_pct', '')::int,
      COALESCE((p_test->>'hints_allowed')::boolean, true),
      COALESCE((p_test->>'offline_pack')::boolean, false),
      COALESCE((p_test->>'status')::public.test_status, 'draft')
    )
    RETURNING id INTO tid;
  ELSE
    UPDATE public.tests SET
      title = p_test->>'title',
      exam_type_id = COALESCE(NULLIF(p_test->>'exam_type_id', ''), exam_type_id),
      subject_ids = COALESCE(p_test->'subject_ids', subject_ids),
      question_count = COALESCE((p_test->>'question_count')::int, question_count),
      time_limit_s = NULLIF(p_test->>'time_limit_s', '')::int,
      pass_mark_pct = NULLIF(p_test->>'pass_mark_pct', '')::int,
      hints_allowed = COALESCE((p_test->>'hints_allowed')::boolean, hints_allowed),
      offline_pack = COALESCE((p_test->>'offline_pack')::boolean, offline_pack),
      status = COALESCE((p_test->>'status')::public.test_status, status)
    WHERE id = tid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'test not found';
    END IF;
  END IF;

  ids := COALESCE(p_test->'question_ids', '[]'::jsonb);
  DELETE FROM public.test_questions WHERE test_id = tid;
  FOR qid IN SELECT jsonb_array_elements_text(ids)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = qid) THEN
      RAISE EXCEPTION 'unknown question %', qid;
    END IF;
    INSERT INTO public.test_questions (test_id, question_id, position)
    VALUES (tid, qid, pos);
    pos := pos + 1;
  END LOOP;

  UPDATE public.tests
  SET question_count = GREATEST(pos, COALESCE((p_test->>'question_count')::int, pos))
  WHERE id = tid;

  PERFORM public.admin_write_audit(uid, 'upsert_test', 'test', jsonb_build_object('id', tid));
  RETURN (
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
        FROM public.test_questions tq WHERE tq.test_id = t.id
      ), '[]'::jsonb)
    )
    FROM public.tests t WHERE t.id = tid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_question_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := public.require_admin();
  result jsonb;
BEGIN
  PERFORM uid;
  SELECT COALESCE(jsonb_agg(row_json ORDER BY attempts DESC, prompt), '[]'::jsonb)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', q.id,
      'prompt', q.prompt,
      'subject_id', q.subject_id,
      'exam_type_id', q.exam_type_id,
      'status', q.status,
      'attempts', COALESCE(s.attempts, 0),
      'correct', COALESCE(s.correct, 0),
      'timeouts', COALESCE(s.timeouts, 0),
      'pct_correct', s.pct_correct,
      'timeout_rate', s.timeout_rate,
      'flag', CASE
        WHEN COALESCE(s.attempts, 0) >= 30 AND s.pct_correct > 90 THEN 'too_easy'
        WHEN COALESCE(s.attempts, 0) >= 30 AND s.pct_correct < 25 THEN 'too_hard'
        ELSE NULL
      END
    ) AS row_json,
    q.prompt,
    COALESCE(s.attempts, 0) AS attempts
    FROM public.questions q
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS attempts,
        count(*) FILTER (WHERE a.is_correct)::int AS correct,
        count(*) FILTER (WHERE a.chosen_index IS NULL OR a.chosen_index < 0)::int AS timeouts,
        CASE WHEN count(*) = 0 THEN NULL
          ELSE round(100.0 * count(*) FILTER (WHERE a.is_correct) / count(*), 1)
        END AS pct_correct,
        CASE WHEN count(*) = 0 THEN NULL
          ELSE round(100.0 * count(*) FILTER (WHERE a.chosen_index IS NULL OR a.chosen_index < 0) / count(*), 1)
        END AS timeout_rate
      FROM public.attempts a
      WHERE a.question_id = q.id
    ) s ON true
  ) x;
  RETURN result;
END;
$$;

DROP POLICY IF EXISTS questions_admin_read ON public.questions;
CREATE POLICY questions_admin_read ON public.questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS tests_admin_read ON public.tests;
CREATE POLICY tests_admin_read ON public.tests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

REVOKE INSERT, UPDATE, DELETE ON public.questions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.tests FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.test_questions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.topics FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.require_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_questions(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_question(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_question_status(text, public.question_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_questions(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_tests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_test(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_question_stats() TO authenticated;
