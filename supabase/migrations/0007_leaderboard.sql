-- Phase 7: public leaderboard from profiles. Guests have no profile row, so they never rank.

CREATE OR REPLACE FUNCTION public.list_leaderboard(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cap int := GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
  top_rows jsonb;
  you_row jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(row_json ORDER BY rank),
    '[]'::jsonb
  )
  INTO top_rows
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'username', username,
      'avatar', avatar,
      'xp', xp,
      'level', level,
      'rank', rank
    ) AS row_json,
    rank
    FROM (
      SELECT
        id,
        username,
        avatar,
        xp,
        level,
        row_number() OVER (ORDER BY xp DESC, username ASC) AS rank
      FROM public.public_profiles
    ) ranked
    WHERE rank <= cap
  ) x;

  IF uid IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', id,
      'username', username,
      'avatar', avatar,
      'xp', xp,
      'level', level,
      'rank', rank
    )
    INTO you_row
    FROM (
      SELECT
        id,
        username,
        avatar,
        xp,
        level,
        row_number() OVER (ORDER BY xp DESC, username ASC) AS rank
      FROM public.public_profiles
    ) ranked
    WHERE id = uid;
  END IF;

  RETURN jsonb_build_object(
    'rows', top_rows,
    'you', you_row,
    'captured_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_leaderboard(integer) TO anon, authenticated;
