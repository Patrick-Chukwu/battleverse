-- Phase 4: challenge / invite on top of Phase 3 live rooms.
-- Run AFTER 0003_battle_rpcs.sql. Reuses battle_pick_questions + the same
-- battles / battle_players / battle_events tables (no second battle engine).

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS battle_id uuid REFERENCES public.battles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS code text;

ALTER TABLE public.invites
  ALTER COLUMN to_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invites_code_uidx
  ON public.invites (code)
  WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS invites_to_pending_idx
  ON public.invites (to_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS invites_from_pending_idx
  ON public.invites (from_id, status)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online'
    CHECK (status IN ('online', 'idle', 'in_battle', 'offline')),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presence_read ON public.user_presence;
CREATE POLICY presence_read ON public.user_presence
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS presence_own ON public.user_presence;
CREATE POLICY presence_own ON public.user_presence
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.invites REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN regexp_replace(COALESCE(p_raw, ''), '[^0-9]', '', 'g') LIKE '00%'
      THEN substr(regexp_replace(p_raw, '[^0-9]', '', 'g'), 3)
    ELSE regexp_replace(COALESCE(p_raw, ''), '[^0-9]', '', 'g')
  END;
$$;

CREATE OR REPLACE FUNCTION public.hash_lookup(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(p_value::bytea, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.invite_is_under13(p_age public.age_band)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_age IN ('6-8', '9-12');
$$;

CREATE OR REPLACE FUNCTION public.invite_presence_of(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN up.user_id IS NULL THEN 'offline'
    WHEN up.status = 'offline' THEN 'offline'
    WHEN up.last_seen_at < now() - interval '45 seconds' THEN 'offline'
    ELSE up.status
  END
  FROM (SELECT p_user_id AS user_id) x
  LEFT JOIN public.user_presence up ON up.user_id = x.user_id;
$$;

CREATE OR REPLACE FUNCTION public.expire_pending_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.invites
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_new_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  FOR i IN 1..12 LOOP
    candidate := '';
    WHILE char_length(candidate) < 6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.invites WHERE code = candidate) THEN
      RETURN candidate;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'could not allocate invite code';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_live_battle(
  p_mode public.battle_mode,
  p_subject_id text,
  p_age_band public.age_band,
  p_user_a uuid,
  p_user_b uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  qids text[];
  i int;
  busy uuid;
BEGIN
  IF p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN
    RAISE EXCEPTION 'need two distinct players';
  END IF;

  SELECT bp.user_id INTO busy
  FROM public.battle_players bp
  JOIN public.battles b ON b.id = bp.battle_id
  WHERE bp.user_id IN (p_user_a, p_user_b) AND b.status IN ('waiting', 'active')
  LIMIT 1;
  IF busy IS NOT NULL THEN
    RAISE EXCEPTION 'a player is already in a live battle';
  END IF;

  qids := public.battle_pick_questions(p_subject_id, p_age_band);

  INSERT INTO public.battles (
    mode, subject_id, age_band, status, current_index, question_started_at, host_clock
  ) VALUES (
    p_mode, p_subject_id, p_age_band, 'active', 0, now(), now()
  )
  RETURNING id INTO new_id;

  INSERT INTO public.battle_players (battle_id, user_id, score, connected, last_seen_at)
  VALUES
    (new_id, p_user_a, 0, true, now()),
    (new_id, p_user_b, 0, true, now());

  FOR i IN 1 .. cardinality(qids) LOOP
    INSERT INTO public.battle_questions (battle_id, question_id, position)
    VALUES (new_id, qids[i], i - 1);
  END LOOP;

  INSERT INTO public.battle_events (battle_id, event_type, payload)
  VALUES (new_id, 'battle:question', jsonb_build_object('index', 0, 'started_at', now()));

  UPDATE public.user_presence
  SET status = 'in_battle', last_seen_at = now()
  WHERE user_id IN (p_user_a, p_user_b);

  RETURN new_id;
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

  new_id := public.create_live_battle('matchmaking', p_subject_id, p_age_band, uid, opponent);
  DELETE FROM public.matchmaking_queue WHERE user_id IN (uid, opponent);

  RETURN jsonb_build_object('queued', false, 'battle_id', new_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_row_json(p_invite public.invites)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  from_username text;
  from_avatar text;
  to_username text;
  to_avatar text;
BEGIN
  SELECT username, avatar INTO from_username, from_avatar
  FROM public.public_profiles WHERE id = p_invite.from_id;
  IF p_invite.to_id IS NOT NULL THEN
    SELECT username, avatar INTO to_username, to_avatar
    FROM public.public_profiles WHERE id = p_invite.to_id;
  END IF;
  RETURN jsonb_build_object(
    'id', p_invite.id,
    'from_id', p_invite.from_id,
    'to_id', p_invite.to_id,
    'subject_id', p_invite.subject_id,
    'age_band', p_invite.age_band,
    'status', p_invite.status,
    'expires_at', p_invite.expires_at,
    'created_at', p_invite.created_at,
    'battle_id', p_invite.battle_id,
    'code', p_invite.code,
    'from_username', from_username,
    'from_avatar', from_avatar,
    'to_username', to_username,
    'to_avatar', to_avatar,
    'from_presence', public.invite_presence_of(p_invite.from_id),
    'to_presence', CASE
      WHEN p_invite.to_id IS NULL THEN NULL
      ELSE public.invite_presence_of(p_invite.to_id)
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_kind text DEFAULT 'auto')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  kind text;
  q text;
  digits text;
  h text;
  rec record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM public.expire_pending_invites();

  q := trim(COALESCE(p_query, ''));
  IF q = '' THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  kind := lower(COALESCE(NULLIF(trim(p_kind), ''), 'auto'));
  IF kind = 'auto' THEN
    IF position('@' IN q) > 0 THEN
      kind := 'email';
    ELSIF regexp_replace(q, '[^0-9+()\s.-]', '', 'g') = q
      AND char_length(public.normalize_phone_digits(q)) >= 7 THEN
      kind := 'phone';
    ELSE
      kind := 'username';
    END IF;
  END IF;

  IF kind = 'username' THEN
    SELECT p.id, p.username, p.avatar, p.age_band
    INTO rec
    FROM public.profiles p
    WHERE p.username = q AND p.discoverable = true AND p.id <> uid
    LIMIT 1;
  ELSIF kind = 'email' THEN
    h := public.hash_lookup(lower(q));
    SELECT p.id, p.username, p.avatar, p.age_band
    INTO rec
    FROM public.profiles p
    WHERE p.email_hash = h
      AND p.discoverable = true
      AND p.id <> uid
      AND p.age_band IN ('13-16', '16plus')
    LIMIT 1;
  ELSIF kind = 'phone' THEN
    digits := public.normalize_phone_digits(q);
    IF char_length(digits) < 7 THEN
      RETURN jsonb_build_object('found', false);
    END IF;
    h := public.hash_lookup(digits);
    SELECT p.id, p.username, p.avatar, p.age_band
    INTO rec
    FROM public.profiles p
    WHERE p.phone_hash = h
      AND p.discoverable = true
      AND p.id <> uid
      AND p.age_band IN ('13-16', '16plus')
    LIMIT 1;
  ELSE
    RAISE EXCEPTION 'unknown search kind';
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'id', rec.id,
    'username', rec.username,
    'avatar', rec.avatar,
    'presence', public.invite_presence_of(rec.id),
    'kind', kind
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_findable_phone(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  digits text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  digits := public.normalize_phone_digits(COALESCE(p_phone, ''));
  IF digits = '' THEN
    UPDATE public.profiles SET phone_hash = NULL WHERE id = uid;
    RETURN jsonb_build_object('ok', true, 'cleared', true);
  END IF;
  IF char_length(digits) < 7 OR char_length(digits) > 15 THEN
    RAISE EXCEPTION 'enter a phone number with country code';
  END IF;

  UPDATE public.profiles
  SET phone_hash = public.hash_lookup(digits)
  WHERE id = uid;

  RETURN jsonb_build_object('ok', true, 'cleared', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_presence(p_status text DEFAULT 'online')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  st text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  st := lower(COALESCE(NULLIF(trim(p_status), ''), 'online'));
  IF st NOT IN ('online', 'idle', 'in_battle', 'offline') THEN
    st := 'online';
  END IF;

  INSERT INTO public.user_presence (user_id, status, last_seen_at)
  VALUES (uid, st, now())
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_seen_at = now();

  RETURN jsonb_build_object('ok', true, 'status', st);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_invite(
  p_to_id uuid,
  p_subject_id text,
  p_age_band public.age_band
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.invites%ROWTYPE;
  created public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  IF p_to_id IS NULL OR p_to_id = uid THEN
    RAISE EXCEPTION 'cannot challenge yourself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = p_subject_id) THEN
    RAISE EXCEPTION 'unknown subject';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_to_id) THEN
    RAISE EXCEPTION 'player not found';
  END IF;

  PERFORM public.expire_pending_invites();

  SELECT * INTO existing
  FROM public.invites
  WHERE from_id = uid AND to_id = p_to_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN public.invite_row_json(existing);
  END IF;

  INSERT INTO public.invites (from_id, to_id, subject_id, age_band, status, expires_at, code)
  VALUES (
    uid,
    p_to_id,
    p_subject_id,
    p_age_band,
    'pending',
    now() + interval '10 minutes',
    public.invite_new_code()
  )
  RETURNING * INTO created;

  RETURN public.invite_row_json(created);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invite_code(
  p_subject_id text,
  p_age_band public.age_band
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  created public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = p_subject_id) THEN
    RAISE EXCEPTION 'unknown subject';
  END IF;

  PERFORM public.expire_pending_invites();

  INSERT INTO public.invites (from_id, to_id, subject_id, age_band, status, expires_at, code)
  VALUES (
    uid,
    NULL,
    p_subject_id,
    p_age_band,
    'pending',
    now() + interval '10 minutes',
    public.invite_new_code()
  )
  RETURNING * INTO created;

  RETURN public.invite_row_json(created);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM public.expire_pending_invites();

  SELECT * INTO inv FROM public.invites WHERE id = p_invite_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;
  IF inv.status = 'accepted' AND inv.battle_id IS NOT NULL THEN
    RETURN public.invite_row_json(inv);
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invite is %', inv.status;
  END IF;
  IF inv.to_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'not the invited player';
  END IF;
  IF inv.from_id = uid THEN
    RAISE EXCEPTION 'cannot accept your own invite';
  END IF;

  new_id := public.create_live_battle(
    'challenge', inv.subject_id, inv.age_band, inv.from_id, uid
  );

  UPDATE public.invites
  SET status = 'accepted', battle_id = new_id
  WHERE id = p_invite_id
  RETURNING * INTO inv;

  UPDATE public.invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND id <> p_invite_id
    AND (from_id IN (uid, inv.from_id) OR to_id IN (uid, inv.from_id));

  DELETE FROM public.matchmaking_queue WHERE user_id IN (uid, inv.from_id);

  RETURN public.invite_row_json(inv);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
  new_id uuid;
  cleaned text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  cleaned := upper(regexp_replace(COALESCE(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  IF cleaned = '' THEN
    RAISE EXCEPTION 'enter an invite code';
  END IF;

  PERFORM public.expire_pending_invites();

  SELECT * INTO inv FROM public.invites WHERE code = cleaned FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;
  IF inv.from_id = uid THEN
    RAISE EXCEPTION 'cannot join your own invite';
  END IF;
  IF inv.status = 'accepted' AND inv.battle_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.battle_players
      WHERE battle_id = inv.battle_id AND user_id = uid
    ) THEN
      RETURN public.invite_row_json(inv);
    END IF;
    RAISE EXCEPTION 'invite already used';
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invite is %', inv.status;
  END IF;
  IF inv.to_id IS NOT NULL AND inv.to_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'invite already claimed';
  END IF;

  new_id := public.create_live_battle(
    'challenge', inv.subject_id, inv.age_band, inv.from_id, uid
  );

  UPDATE public.invites
  SET status = 'accepted', battle_id = new_id, to_id = uid
  WHERE id = inv.id
  RETURNING * INTO inv;

  UPDATE public.invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND id <> inv.id
    AND (from_id IN (uid, inv.from_id) OR to_id IN (uid, inv.from_id));

  DELETE FROM public.matchmaking_queue WHERE user_id IN (uid, inv.from_id);

  RETURN public.invite_row_json(inv);
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT * INTO inv FROM public.invites WHERE id = p_invite_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;
  IF inv.to_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'not the invited player';
  END IF;
  IF inv.status <> 'pending' THEN
    RETURN public.invite_row_json(inv);
  END IF;

  UPDATE public.invites SET status = 'declined' WHERE id = p_invite_id RETURNING * INTO inv;
  RETURN public.invite_row_json(inv);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT * INTO inv FROM public.invites WHERE id = p_invite_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;
  IF inv.from_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'not the challenger';
  END IF;
  IF inv.status <> 'pending' THEN
    RETURN public.invite_row_json(inv);
  END IF;

  UPDATE public.invites
  SET status = 'expired', expires_at = now()
  WHERE id = p_invite_id
  RETURNING * INTO inv;

  RETURN public.invite_row_json(inv);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_invites()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  incoming jsonb;
  outgoing jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM public.expire_pending_invites();

  SELECT COALESCE(jsonb_agg(public.invite_row_json(i) ORDER BY i.created_at DESC), '[]'::jsonb)
  INTO incoming
  FROM public.invites i
  WHERE i.to_id = uid AND i.status IN ('pending', 'accepted', 'declined', 'expired')
    AND i.created_at > now() - interval '2 hours';

  SELECT COALESCE(jsonb_agg(public.invite_row_json(i) ORDER BY i.created_at DESC), '[]'::jsonb)
  INTO outgoing
  FROM public.invites i
  WHERE i.from_id = uid AND i.status IN ('pending', 'accepted', 'declined', 'expired')
    AND i.created_at > now() - interval '2 hours';

  RETURN jsonb_build_object('incoming', incoming, 'outgoing', outgoing);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM public.expire_pending_invites();

  SELECT * INTO inv FROM public.invites WHERE id = p_invite_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;
  IF inv.from_id IS DISTINCT FROM uid AND inv.to_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'not a party to this invite';
  END IF;
  RETURN public.invite_row_json(inv);
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_phone_digits(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_findable_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_presence(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_invite(uuid, text, public.age_band) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invite_code(text, public.age_band) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_invites() TO authenticated;
GRANT SELECT ON public.user_presence TO authenticated;
