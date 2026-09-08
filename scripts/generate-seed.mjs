import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/data/quizData.ts"), "utf8");
const match = src.match(/export const questions: Question\[\] = (\[[\s\S]*?\n\]);/);
if (!match) throw new Error("Could not find questions array in quizData.ts");
const questions = Function(`"use strict"; return ${match[1]}`)();

const sql = `-- Battleverse Phase 1 seed (mirrors src/data/quizData.ts + gameData.ts).
-- Run AFTER supabase/migrations/0001_init.sql.

INSERT INTO public.exam_types (id, name) VALUES
  ('casual', 'Casual'),
  ('jamb', 'JAMB / UTME'),
  ('waec', 'WAEC'),
  ('custom', 'Custom')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subjects (id, name, emoji, color, description) VALUES
  ('tech', 'Tech & Coding', '💻', 'game-blue', 'Computers, internet & coding basics'),
  ('ai', 'AI & Future Tech', '🤖', 'game-purple', 'Artificial intelligence & the future'),
  ('math', 'Mathematics', '➗', 'game-orange', 'Numbers, puzzles & logic'),
  ('general', 'General Knowledge', '🌍', 'game-green', 'Science, facts & reasoning')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.badges (id, name, emoji, description, requirement) VALUES
  ('first-win', 'First Victory', '🏆', 'Complete your first quiz', 'Complete 1 quiz'),
  ('speed-demon', 'Speed Demon', '⚡', 'Answer 5 questions in under 3 seconds each', '5 fast answers'),
  ('genius', 'Genius', '🧠', 'Get a perfect score on any quiz', '100% score'),
  ('streak-king', 'Streak King', '🔥', 'Get a 5-answer streak', '5 correct in a row'),
  ('explorer', 'Explorer', '🧭', 'Try all 4 subjects', 'Play all subjects'),
  ('math-whiz', 'Math Whiz', '🔢', 'Score 100% on a math quiz', 'Perfect math score'),
  ('tech-guru', 'Tech Guru', '💻', 'Score 100% on a tech quiz', 'Perfect tech score'),
  ('ai-master', 'AI Master', '🤖', 'Score 100% on an AI quiz', 'Perfect AI score')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (
  id, prompt, options, correct_index, explanation, subject_id, difficulty, age_band, exam_type_id, status
)
SELECT
  q->>'id',
  q->>'question',
  q->'options',
  (q->>'correctIndex')::int,
  q->>'explanation',
  q->>'subject',
  (q->>'difficulty')::public.difficulty,
  (q->>'ageGroup')::public.age_band,
  'casual',
  'published'
FROM jsonb_array_elements($seed$
${JSON.stringify(questions, null, 2)}
$seed$::jsonb) AS q
ON CONFLICT (id) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation,
  subject_id = EXCLUDED.subject_id,
  difficulty = EXCLUDED.difficulty,
  age_band = EXCLUDED.age_band,
  exam_type_id = EXCLUDED.exam_type_id,
  status = EXCLUDED.status;
`;

writeFileSync(join(root, "supabase/seed.sql"), sql);
console.log(`wrote supabase/seed.sql (${questions.length} questions)`);
