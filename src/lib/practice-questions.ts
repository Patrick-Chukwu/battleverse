import { getQuestionsBySubject, questions as bundled, shuffleArray, type Question, type Subject } from "@/data/quizData";
import { isDexieQuestionsEnabled } from "@/lib/flags";
import { offlineDb, type CachedQuestion } from "@/lib/offline-db";

function toQuestion(row: CachedQuestion): Question {
  return {
    id: row.id,
    question: row.question,
    options: row.options,
    correctIndex: row.correctIndex,
    explanation: row.explanation,
    subject: row.subject,
    difficulty: row.difficulty,
    ageGroup: row.ageGroup,
  };
}

export async function seedBundledQuestions(): Promise<void> {
  if (!isDexieQuestionsEnabled()) return;
  const count = await offlineDb.questions.count();
  if (count > 0) return;
  const now = new Date().toISOString();
  await offlineDb.questions.bulkPut(
    bundled.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      subject: q.subject,
      difficulty: q.difficulty,
      ageGroup: q.ageGroup,
      updatedAt: now,
    }))
  );
}

export async function cacheServerQuestions(
  rows: Array<{
    id: string;
    prompt: string;
    options: string[];
    correct_index: number;
    explanation: string;
    subject_id: string;
    difficulty: Question["difficulty"];
    age_band: Question["ageGroup"];
    updated_at?: string;
  }>
): Promise<void> {
  const now = new Date().toISOString();
  await offlineDb.questions.bulkPut(
    rows.map((q) => ({
      id: q.id,
      question: q.prompt,
      options: q.options as [string, string, string, string],
      correctIndex: q.correct_index,
      explanation: q.explanation,
      subject: q.subject_id as Subject,
      difficulty: q.difficulty,
      ageGroup: q.age_band,
      updatedAt: q.updated_at ?? now,
    }))
  );
  await offlineDb.meta.put({ key: "lastSyncAt", value: now });
}

export async function loadPracticeQuestions(subjectId: Subject, count = 8): Promise<Question[]> {
  if (isDexieQuestionsEnabled()) {
    await seedBundledQuestions();
    const cached = await offlineDb.questions.where("subject").equals(subjectId).toArray();
    if (cached.length > 0) {
      return shuffleArray(cached.map(toQuestion)).slice(0, count);
    }
  }
  return shuffleArray(getQuestionsBySubject(subjectId)).slice(0, count);
}

export async function subjectPackReady(subjectId: Subject): Promise<boolean> {
  if (!isDexieQuestionsEnabled()) return false;
  const n = await offlineDb.questions.where("subject").equals(subjectId).count();
  return n > 0;
}

export async function lastQuestionSyncAt(): Promise<string | null> {
  const row = await offlineDb.meta.get("lastSyncAt");
  return row?.value ?? null;
}
