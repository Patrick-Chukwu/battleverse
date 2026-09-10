-- Add Bible and English subjects, and pick 10 questions per live battle.

INSERT INTO public.subjects (id, name, emoji, color, description) VALUES
  ('bible', 'Bible', '📖', 'game-pink', 'Scripture stories, people & verses'),
  ('english', 'English', '📚', 'game-gold', 'Grammar, vocabulary & language skills')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  description = EXCLUDED.description;

UPDATE public.badges
SET description = 'Try all 6 subjects'
WHERE id = 'explorer';

CREATE OR REPLACE FUNCTION public.battle_pick_questions(p_subject_id text, p_age_band public.age_band)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  qids text[];
  wanted int := 10;
BEGIN
  qids := ARRAY(
    SELECT id FROM public.questions
    WHERE status = 'published' AND subject_id = p_subject_id AND age_band = p_age_band
    ORDER BY random()
    LIMIT wanted
  );
  IF coalesce(cardinality(qids), 0) < wanted THEN
    qids := COALESCE(qids, ARRAY[]::text[]) || ARRAY(
      SELECT id FROM public.questions
      WHERE status = 'published'
        AND subject_id = p_subject_id
        AND NOT (id = ANY (COALESCE(qids, ARRAY[]::text[])))
      ORDER BY random()
      LIMIT wanted - coalesce(cardinality(qids), 0)
    );
  END IF;
  IF coalesce(cardinality(qids), 0) < 1 THEN
    RAISE EXCEPTION 'not enough published questions for this subject';
  END IF;
  RETURN qids;
END;
$$;
