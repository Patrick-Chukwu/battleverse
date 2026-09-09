-- Phase 3: live matchmaking, server clock, answers, forfeit.
-- Run AFTER 0001_init.sql, 0002_practice_rpcs.sql, and seed.sql.
-- Re-run seed.sql after this if you need the extra per-band questions.

ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS question_duration_ms integer NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS reveal_ms integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS xp_awarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forfeit_user_id uuid REFERENCES public.profiles (id);

ALTER TABLE public.battle_players
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_correct boolean,
  ADD COLUMN IF NOT EXISTS disconnected_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS matchmaking_queue_user_uidx
  ON public.matchmaking_queue (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS attempts_battle_player_question_uidx
  ON public.attempts (battle_id, user_id, question_id)
  WHERE battle_id IS NOT NULL;

ALTER TABLE public.battles REPLICA IDENTITY FULL;
ALTER TABLE public.battle_players REPLICA IDENTITY FULL;
ALTER TABLE public.battle_events REPLICA IDENTITY FULL;
ALTER TABLE public.matchmaking_queue REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_players;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.battle_pick_questions(p_subject_id text, p_age_band public.age_band)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  qids text[];
BEGIN
  qids := ARRAY(
    SELECT id FROM public.questions
    WHERE status = 'published' AND subject_id = p_subject_id AND age_band = p_age_band
    ORDER BY random()
    LIMIT 5
  );
  IF coalesce(cardinality(qids), 0) < 5 THEN
    qids := COALESCE(qids, ARRAY[]::text[]) || ARRAY(
      SELECT id FROM public.questions
      WHERE status = 'published'
        AND subject_id = p_subject_id
        AND NOT (id = ANY (COALESCE(qids, ARRAY[]::text[])))
      ORDER BY random()
      LIMIT 5 - coalesce(cardinality(qids), 0)
    );
  END IF;
  IF coalesce(cardinality(qids), 0) < 1 THEN
    RAISE EXCEPTION 'not enough published questions for this subject';
  END IF;
  RETURN qids;
END;
$$;

CREATE OR REPLACE FUNCTION public.battle_award_xp(p_battle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  b public.battles%ROWTYPE;
BEGIN
  SELECT * INTO b FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND OR b.xp_awarded THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT user_id, score FROM public.battle_players WHERE battle_id = p_battle_id
  LOOP
    IF rec.score > 0 THEN
      INSERT INTO public.xp_events (user_id, source, amount)
      VALUES (rec.user_id, 'battle', rec.score);
      UPDATE public.profiles
      SET
        xp = profiles.xp + rec.score,
        coins = profiles.coins + FLOOR(rec.score / 5.0),
        level = public.practice_level(profiles.xp + rec.score)
      WHERE id = rec.user_id;
    END IF;
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (rec.user_id, 'first-win')
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.battles SET xp_awarded = true WHERE id = p_battle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_battle_state(p_battle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.battles%ROWTYPE;
  elapsed_ms numeric;
  answering_over boolean;
  qcount int;
  current_qid text;
  my_ans jsonb;
  players jsonb;
  qs jsonb;
  all_answered boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT * INTO b FROM public.battles WHERE id = p_battle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'battle not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.battle_players bp
    WHERE bp.battle_id = p_battle_id AND bp.user_id = uid
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  SELECT count(*)::int INTO qcount FROM public.battle_questions WHERE battle_id = p_battle_id;
  elapsed_ms := GREATEST(0, EXTRACT(EPOCH FROM (now() - COALESCE(b.question_started_at, now()))) * 1000);
  answering_over := elapsed_ms >= COALESCE(b.question_duration_ms, 10000);

  SELECT question_id INTO current_qid
  FROM public.battle_questions
  WHERE battle_id = p_battle_id AND position = b.current_index;

  SELECT jsonb_build_object(
    'question_id', a.question_id,
    'chosen_index', a.chosen_index,
    'is_correct', a.is_correct,
    'explanation', q.explanation,
    'correct_index', q.correct_index,
    'xp', a.xp_awarded
  )
  INTO my_ans
  FROM public.attempts a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.battle_id = p_battle_id AND a.user_id = uid AND a.question_id = current_qid;

  SELECT COALESCE(jsonb_agg(p ORDER BY p.username), '[]'::jsonb) INTO players
  FROM (
    SELECT
      bp.user_id,
      pp.username,
      pp.avatar,
      bp.score,
      bp.connected,
      bp.last_correct,
      bp.last_seen_at,
      bp.disconnected_at
    FROM public.battle_players bp
    JOIN public.public_profiles pp ON pp.id = bp.user_id
    WHERE bp.battle_id = p_battle_id
  ) p;

  SELECT COALESCE(bool_and(answered), false) INTO all_answered
  FROM (
    SELECT EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.battle_id = p_battle_id
        AND a.user_id = bp.user_id
        AND a.question_id = current_qid
    ) AS answered
    FROM public.battle_players bp
    WHERE bp.battle_id = p_battle_id
  ) x;

  SELECT COALESCE(jsonb_agg(item ORDER BY item->>'position'), '[]'::jsonb) INTO qs
  FROM (
    SELECT jsonb_build_object(
      'id', q.id,
      'prompt', q.prompt,
      'options', q.options,
      'position', bq.position,
      'correct_index', CASE
        WHEN bq.position < b.current_index OR (bq.position = b.current_index AND (my_ans IS NOT NULL OR answering_over))
        THEN q.correct_index
        ELSE NULL
      END,
      'explanation', CASE
        WHEN bq.position < b.current_index OR (bq.position = b.current_index AND (my_ans IS NOT NULL OR answering_over))
        THEN q.explanation
        ELSE NULL
      END
    ) AS item
    FROM public.battle_questions bq
    JOIN public.questions q ON q.id = bq.question_id
    WHERE bq.battle_id = p_battle_id
  ) listed;

  RETURN jsonb_build_object(
    'battle_id', b.id,
    'status', b.status,
    'current_index', b.current_index,
    'question_started_at', b.question_started_at,
    'question_duration_ms', b.question_duration_ms,
    'reveal_ms', b.reveal_ms,
    'server_now', now(),
    'question_count', qcount,
    'forfeit_user_id', b.forfeit_user_id,
    'xp_awarded', b.xp_awarded,
    'players', players,
    'questions', qs,
    'my_answer', my_ans,
    'all_answered', COALESCE(all_answered, false),
    'answering_over', answering_over
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_matchmaking(p_subject_id text, p_age_band public.age_band)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing uuid;
  opponent uuid;
  new_id uuid;
  qids text[];
  i int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = p_subject_id) THEN
    RAISE EXCEPTION 'unknown subject';
  END IF;

  DELETE FROM public.matchmaking_queue WHERE created_at < now() - interval '5 minutes';

  PERFORM pg_advisory_xact_lock(hashtext(p_subject_id || ':' || p_age_band::text));

  SELECT bp.battle_id INTO existing
  FROM public.battle_players bp
  JOIN public.battles b ON b.id = bp.battle_id
  WHERE bp.user_id = uid AND b.status IN ('waiting', 'active')
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN jsonb_build_object('queued', false, 'battle_id', existing);
  END IF;

  PERFORM 1 FROM public.matchmaking_queue
  WHERE subject_id = p_subject_id AND age_band = p_age_band
  FOR UPDATE;

  SELECT user_id INTO opponent
  FROM public.matchmaking_queue
  WHERE subject_id = p_subject_id AND age_band = p_age_band AND user_id <> uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF opponent IS NULL THEN
    INSERT INTO public.matchmaking_queue (user_id, subject_id, age_band)
    VALUES (uid, p_subject_id, p_age_band)
    ON CONFLICT (user_id) DO UPDATE SET
      subject_id = EXCLUDED.subject_id,
      age_band = EXCLUDED.age_band,
      created_at = now();
    RETURN jsonb_build_object(
      'queued', true,
      'queue_id', (SELECT id FROM public.matchmaking_queue WHERE user_id = uid)
    );
  END IF;

  qids := public.battle_pick_questions(p_subject_id, p_age_band);

  INSERT INTO public.battles (
    mode, subject_id, age_band, status, current_index, question_started_at, host_clock
  ) VALUES (
    'matchmaking', p_subject_id, p_age_band, 'active', 0, now(), now()
  )
  RETURNING id INTO new_id;

  INSERT INTO public.battle_players (battle_id, user_id, score, connected, last_seen_at)
  VALUES
    (new_id, uid, 0, true, now()),
    (new_id, opponent, 0, true, now());

  FOR i IN 1 .. cardinality(qids) LOOP
    INSERT INTO public.battle_questions (battle_id, question_id, position)
    VALUES (new_id, qids[i], i - 1);
  END LOOP;

  INSERT INTO public.battle_events (battle_id, event_type, payload)
  VALUES (new_id, 'battle:question', jsonb_build_object('index', 0, 'started_at', now()));

  DELETE FROM public.matchmaking_queue WHERE user_id IN (uid, opponent);

  RETURN jsonb_build_object('queued', false, 'battle_id', new_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_matchmaking()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  DELETE FROM public.matchmaking_queue WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_matchmaking_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  bid uuid;
  qid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT bp.battle_id INTO bid
  FROM public.battle_players bp
  JOIN public.battles b ON b.id = bp.battle_id
  WHERE bp.user_id = uid AND b.status IN ('waiting', 'active')
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF bid IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'matched', 'battle_id', bid);
  END IF;

  SELECT id INTO qid FROM public.matchmaking_queue WHERE user_id = uid;
  IF qid IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'queued', 'queue_id', qid);
  END IF;

  RETURN jsonb_build_object('status', 'idle');
END;
$$;

CREATE OR REPLACE FUNCTION public.battle_heartbeat(p_battle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  UPDATE public.battle_players
  SET
    connected = true,
    last_seen_at = now(),
    disconnected_at = NULL
  WHERE battle_id = p_battle_id AND user_id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  RETURN public.tick_battle(p_battle_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_battle_answer(
  p_battle_id uuid,
  p_question_id text,
  p_option_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.battles%ROWTYPE;
  q public.questions%ROWTYPE;
  current_qid text;
  elapsed numeric;
  seconds_left numeric;
  ok boolean;
  xp int;
  existing public.attempts%ROWTYPE;
  attempt_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT * INTO b FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'battle not found';
  END IF;
  IF b.status <> 'active' THEN
    RETURN public.get_battle_state(p_battle_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.battle_players WHERE battle_id = p_battle_id AND user_id = uid
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  SELECT question_id INTO current_qid
  FROM public.battle_questions
  WHERE battle_id = p_battle_id AND position = b.current_index;

  IF current_qid IS DISTINCT FROM p_question_id THEN
    RAISE EXCEPTION 'not the current question';
  END IF;

  SELECT * INTO existing
  FROM public.attempts
  WHERE battle_id = p_battle_id AND user_id = uid AND question_id = p_question_id;

  IF FOUND THEN
    RETURN public.get_battle_state(p_battle_id) || jsonb_build_object('duplicate', true);
  END IF;

  SELECT * INTO q FROM public.questions WHERE id = p_question_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found';
  END IF;

  elapsed := EXTRACT(EPOCH FROM (now() - COALESCE(b.question_started_at, now())));
  seconds_left := GREATEST(0, (COALESCE(b.question_duration_ms, 10000) / 1000.0) - elapsed);
  ok := p_option_index = q.correct_index;
  xp := CASE WHEN ok THEN 100 + CEIL(seconds_left * 10)::int ELSE 0 END;

  attempt_id := gen_random_uuid();
  INSERT INTO public.attempts (
    id, user_id, question_id, battle_id, chosen_index, is_correct, elapsed_ms, xp_awarded
  ) VALUES (
    attempt_id,
    uid,
    q.id,
    p_battle_id,
    p_option_index,
    ok,
    GREATEST(0, (elapsed * 1000)::int),
    xp
  );

  UPDATE public.battle_players
  SET
    score = score + xp,
    last_correct = ok,
    last_seen_at = now(),
    connected = true,
    disconnected_at = NULL
  WHERE battle_id = p_battle_id AND user_id = uid;

  INSERT INTO public.battle_events (battle_id, event_type, payload)
  VALUES (
    p_battle_id,
    'battle:scores',
    jsonb_build_object('user_id', uid, 'xp', xp, 'is_correct', ok)
  );

  RETURN public.get_battle_state(p_battle_id) || jsonb_build_object('duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.tick_battle(p_battle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.battles%ROWTYPE;
  elapsed_ms numeric;
  qcount int;
  current_qid text;
  rec record;
  qrow public.questions%ROWTYPE;
  disconnect_after interval := interval '8 seconds';
  forfeit_after interval := interval '20 seconds';
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT * INTO b FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'battle not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.battle_players WHERE battle_id = p_battle_id AND user_id = uid
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  UPDATE public.battle_players
  SET connected = true, last_seen_at = now(), disconnected_at = NULL
  WHERE battle_id = p_battle_id AND user_id = uid;

  IF b.status <> 'active' THEN
    RETURN public.get_battle_state(p_battle_id);
  END IF;

  -- Mark silent clients disconnected after missed heartbeats; forfeit after 20s.
  UPDATE public.battle_players
  SET
    connected = false,
    disconnected_at = COALESCE(disconnected_at, last_seen_at)
  WHERE battle_id = p_battle_id
    AND last_seen_at < now() - disconnect_after
    AND connected = true;

  SELECT * INTO rec
  FROM public.battle_players
  WHERE battle_id = p_battle_id
    AND last_seen_at < now() - forfeit_after
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.battles
    SET status = 'forfeit', forfeit_user_id = rec.user_id
    WHERE id = p_battle_id;
    INSERT INTO public.battle_events (battle_id, event_type, payload)
    VALUES (p_battle_id, 'battle:forfeit', jsonb_build_object('user_id', rec.user_id));
    PERFORM public.battle_award_xp(p_battle_id);
    RETURN public.get_battle_state(p_battle_id);
  END IF;

  SELECT count(*)::int INTO qcount FROM public.battle_questions WHERE battle_id = p_battle_id;
  elapsed_ms := EXTRACT(EPOCH FROM (now() - COALESCE(b.question_started_at, now()))) * 1000;

  SELECT question_id INTO current_qid
  FROM public.battle_questions
  WHERE battle_id = p_battle_id AND position = b.current_index;

  IF elapsed_ms >= COALESCE(b.question_duration_ms, 10000) THEN
    FOR rec IN
      SELECT bp.user_id
      FROM public.battle_players bp
      WHERE bp.battle_id = p_battle_id
        AND NOT EXISTS (
          SELECT 1 FROM public.attempts a
          WHERE a.battle_id = p_battle_id
            AND a.user_id = bp.user_id
            AND a.question_id = current_qid
        )
    LOOP
      SELECT * INTO qrow FROM public.questions WHERE id = current_qid;
      INSERT INTO public.attempts (
        id, user_id, question_id, battle_id, chosen_index, is_correct, elapsed_ms, xp_awarded
      ) VALUES (
        gen_random_uuid(), rec.user_id, current_qid, p_battle_id, -1, false,
        COALESCE(b.question_duration_ms, 10000), 0
      )
      ON CONFLICT (battle_id, user_id, question_id) WHERE battle_id IS NOT NULL DO NOTHING;
      UPDATE public.battle_players
      SET last_correct = false
      WHERE battle_id = p_battle_id AND user_id = rec.user_id;
    END LOOP;
  END IF;

  IF elapsed_ms >= COALESCE(b.question_duration_ms, 10000) + COALESCE(b.reveal_ms, 2000) THEN
    IF b.current_index >= qcount - 1 THEN
      UPDATE public.battles SET status = 'complete' WHERE id = p_battle_id;
      INSERT INTO public.battle_events (battle_id, event_type, payload)
      VALUES (p_battle_id, 'battle:complete', '{}'::jsonb);
      PERFORM public.battle_award_xp(p_battle_id);
    ELSE
      UPDATE public.battles
      SET
        current_index = current_index + 1,
        question_started_at = now(),
        host_clock = now()
      WHERE id = p_battle_id;
      UPDATE public.battle_players
      SET last_correct = NULL
      WHERE battle_id = p_battle_id;
      INSERT INTO public.battle_events (battle_id, event_type, payload)
      VALUES (
        p_battle_id,
        'battle:question',
        jsonb_build_object('index', b.current_index + 1)
      );
    END IF;
  END IF;

  RETURN public.get_battle_state(p_battle_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_battle_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_matchmaking(text, public.age_band) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_matchmaking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_matchmaking_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.battle_heartbeat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_battle_answer(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tick_battle(uuid) TO authenticated;
