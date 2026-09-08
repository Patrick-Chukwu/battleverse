import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const questions = [
  { id: "t1", question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Core Processing Utility"], correctIndex: 0, explanation: "CPU stands for Central Processing Unit — the brain of your computer!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t2", question: "Which of these is a programming language?", options: ["HTML", "Python", "Windows", "Chrome"], correctIndex: 1, explanation: "Python is a popular programming language used to build apps, games, and AI!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t3", question: "What does 'www' stand for?", options: ["World Wide Web", "Wide World Web", "Web World Wide", "World Web Wide"], correctIndex: 0, explanation: "WWW stands for World Wide Web — the system of websites on the internet.", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t4", question: "What is the main purpose of RAM in a computer?", options: ["Store files permanently", "Temporary fast memory", "Connect to internet", "Display graphics"], correctIndex: 1, explanation: "RAM is temporary memory that helps your computer run programs quickly!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t5", question: "In Scratch, what does a 'loop' do?", options: ["Stops the program", "Repeats actions", "Deletes a sprite", "Changes the background"], correctIndex: 1, explanation: "A loop repeats a set of instructions over and over — super useful in coding!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t6", question: "What is an algorithm?", options: ["A type of computer", "A step-by-step set of instructions", "A website", "A video game"], correctIndex: 1, explanation: "An algorithm is like a recipe — step-by-step instructions to solve a problem!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t7", question: "What does 'debugging' mean in programming?", options: ["Adding bugs to code", "Finding and fixing errors", "Deleting a program", "Making code run faster"], correctIndex: 1, explanation: "Debugging means finding and fixing mistakes (bugs) in your code!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t8", question: "What is binary code made up of?", options: ["Letters A-Z", "Numbers 0 and 1", "Colors", "Emojis"], correctIndex: 1, explanation: "Binary code uses only 0s and 1s — it's the language computers understand!", subject: "tech", difficulty: "hard", ageGroup: "13-16" },
  { id: "a1", question: "Which of these is an example of AI?", options: ["A calculator", "A voice assistant like Siri", "A light bulb", "A bicycle"], correctIndex: 1, explanation: "Voice assistants like Siri use AI to understand and respond to your voice!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a2", question: "What does AI stand for?", options: ["Awesome Internet", "Artificial Intelligence", "Automatic Input", "Advanced Information"], correctIndex: 1, explanation: "AI stands for Artificial Intelligence — machines that can learn and think!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a3", question: "Can AI learn from data?", options: ["Yes, that's how it gets smarter", "No, it only follows rules", "Only on weekends", "Only if you ask nicely"], correctIndex: 0, explanation: "AI learns from lots of data to get better at tasks — this is called machine learning!", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a4", question: "What is a robot?", options: ["A type of food", "A machine that can do tasks automatically", "A musical instrument", "A type of cloud"], correctIndex: 1, explanation: "A robot is a machine designed to carry out tasks, sometimes using AI!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a5", question: "Which technology helps self-driving cars see the road?", options: ["Microphones", "Sensors and cameras", "Speakers", "Keyboards"], correctIndex: 1, explanation: "Self-driving cars use sensors, cameras, and AI to navigate roads safely!", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a6", question: "What is 'machine learning'?", options: ["Teaching machines to read books", "AI that improves by learning from data", "Machines going to school", "A type of exercise"], correctIndex: 1, explanation: "Machine learning is when AI systems learn patterns from data to make predictions!", subject: "ai", difficulty: "hard", ageGroup: "13-16" },
  { id: "m1", question: "What is 5 × 6?", options: ["25", "30", "35", "56"], correctIndex: 1, explanation: "5 × 6 = 30. Think of it as 5 groups of 6!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m2", question: "What is 144 ÷ 12?", options: ["11", "12", "13", "14"], correctIndex: 1, explanation: "144 ÷ 12 = 12. This is because 12 × 12 = 144!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m3", question: "What shape has 6 sides?", options: ["Pentagon", "Hexagon", "Octagon", "Triangle"], correctIndex: 1, explanation: "A hexagon has 6 sides. 'Hex' means six!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m4", question: "If you have 3 apples and get 7 more, how many do you have?", options: ["8", "9", "10", "11"], correctIndex: 2, explanation: "3 + 7 = 10 apples. Nice addition!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m5", question: "What is 15% of 200?", options: ["15", "25", "30", "35"], correctIndex: 2, explanation: "15% of 200 = 0.15 × 200 = 30!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m6", question: "What is the next number: 2, 4, 8, 16, ...?", options: ["18", "24", "32", "20"], correctIndex: 2, explanation: "Each number doubles! 16 × 2 = 32. This is a geometric sequence.", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m7", question: "What is the square root of 81?", options: ["7", "8", "9", "10"], correctIndex: 2, explanation: "√81 = 9 because 9 × 9 = 81!", subject: "math", difficulty: "hard", ageGroup: "13-16" },
  { id: "m8", question: "A triangle's angles always add up to how many degrees?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1, explanation: "The angles of any triangle always sum to 180°!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "g1", question: "What should you do if a stranger messages you online?", options: ["Reply immediately", "Share your address", "Tell a trusted adult", "Send them a photo"], correctIndex: 2, explanation: "Always tell a trusted adult if a stranger contacts you online. Stay safe!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g2", question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, explanation: "Mars is called the Red Planet because of its reddish appearance!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g3", question: "What gas do plants absorb from the air?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], correctIndex: 1, explanation: "Plants absorb CO₂ and release oxygen — that's photosynthesis!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g4", question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctIndex: 2, explanation: "There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g5", question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, explanation: "The Pacific Ocean is the largest, covering more area than all land combined!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g6", question: "What is the chemical symbol for water?", options: ["H₂O", "CO₂", "O₂", "NaCl"], correctIndex: 0, explanation: "Water is H₂O — two hydrogen atoms and one oxygen atom!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g7", question: "Which force keeps us on the ground?", options: ["Magnetism", "Friction", "Gravity", "Electricity"], correctIndex: 2, explanation: "Gravity is the force that pulls objects toward Earth's center!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g8", question: "How many bones does an adult human body have?", options: ["106", "206", "306", "406"], correctIndex: 1, explanation: "Adults have 206 bones. Babies actually have more — about 270!", subject: "general", difficulty: "hard", ageGroup: "13-16" },
];

const json = JSON.stringify(questions, null, 2);

const sql = `-- Battleverse Phase 1 seed (mirrors src/data/quizData.ts + gameData.ts).
-- Run after 0001_init.sql.
-- Regenerated by: node scripts/generate-seed.mjs

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
${json}
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

const out = join(dirname(fileURLToPath(import.meta.url)), "../supabase/seed.sql");
writeFileSync(out, sql);
console.log(`wrote ${out} (${questions.length} questions)`);
