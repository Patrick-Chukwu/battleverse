import type { Question, Subject } from "@/data/quizData";
import { rpcErrorMessage } from "@/lib/admin-api";
import type { CachedExamPaper } from "@/lib/offline-db";
import { offlineDb } from "@/lib/offline-db";
import { cacheServerQuestions } from "@/lib/practice-questions";
import { getSupabase } from "@/lib/supabase";

export interface ExamPaperQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  subject_id: Subject;
  difficulty: Question["difficulty"];
  age_band: Question["ageGroup"];
}

export interface ExamPaper {
  id: string;
  title: string;
  exam_type_id: string;
  subject_ids: string[];
  question_count: number;
  time_limit_s: number | null;
  pass_mark_pct: number | null;
  hints_allowed: boolean;
  offline_pack: boolean;
  status: string;
  updated_at: string;
  question_ids: string[];
  questions?: ExamPaperQuestion[];
}

function toCached(paper: ExamPaper): CachedExamPaper {
  return {
    id: paper.id,
    title: paper.title,
    examTypeId: paper.exam_type_id,
    subjectIds: paper.subject_ids ?? [],
    questionCount: paper.question_count,
    timeLimitS: paper.time_limit_s,
    passMarkPct: paper.pass_mark_pct,
    hintsAllowed: paper.hints_allowed,
    offlinePack: paper.offline_pack,
    questionIds: paper.question_ids ?? [],
    updatedAt: paper.updated_at,
  };
}

function fromCached(row: CachedExamPaper): ExamPaper {
  return {
    id: row.id,
    title: row.title,
    exam_type_id: row.examTypeId,
    subject_ids: row.subjectIds,
    question_count: row.questionCount,
    time_limit_s: row.timeLimitS,
    pass_mark_pct: row.passMarkPct,
    hints_allowed: row.hintsAllowed,
    offline_pack: row.offlinePack,
    status: "published",
    updated_at: row.updatedAt,
    question_ids: row.questionIds,
  };
}

export function paperToQuestions(paper: ExamPaper): Question[] {
  const fromPayload = paper.questions ?? [];
  if (fromPayload.length > 0) {
    return fromPayload.map((q) => ({
      id: q.id,
      question: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
      subject: q.subject_id,
      difficulty: q.difficulty,
      ageGroup: q.age_band,
    }));
  }
  return [];
}

async function cachePaper(paper: ExamPaper): Promise<void> {
  await offlineDb.tests.put(toCached(paper));
  if (paper.questions && paper.questions.length > 0) {
    await cacheServerQuestions(
      paper.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        subject_id: q.subject_id,
        difficulty: q.difficulty,
        age_band: q.age_band,
        updated_at: paper.updated_at,
      })),
      { replaceAll: false },
    );
  }
}

export async function listCachedExamPapers(): Promise<ExamPaper[]> {
  const rows = await offlineDb.tests.toArray();
  return rows.map(fromCached);
}

export async function fetchPublishedTests(): Promise<ExamPaper[]> {
  const supabase = getSupabase();
  if (!supabase || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return listCachedExamPapers();
  }
  const { data, error } = await supabase.rpc("list_published_tests");
  if (error) throw new Error(rpcErrorMessage(error, "Could not load exam papers."));
  const papers = (Array.isArray(data) ? data : []) as ExamPaper[];
  await offlineDb.tests.bulkPut(papers.map(toCached));
  const liveIds = papers.map((p) => p.id);
  const cached = await offlineDb.tests.toArray();
  const stale = cached.filter((row) => !liveIds.includes(row.id)).map((row) => row.id);
  if (stale.length > 0) await offlineDb.tests.bulkDelete(stale);
  return papers;
}

export async function fetchExamPaper(id: string): Promise<ExamPaper | null> {
  const supabase = getSupabase();
  if (supabase && (typeof navigator === "undefined" || navigator.onLine)) {
    const { data, error } = await supabase.rpc("get_exam_paper", { p_id: id });
    if (error) throw new Error(rpcErrorMessage(error, "Could not load this paper."));
    if (data) {
      const paper = data as ExamPaper;
      await cachePaper(paper);
      return paper;
    }
  }
  const cached = await offlineDb.tests.get(id);
  if (!cached) return null;
  const paper = fromCached(cached);
  const questions = await offlineDb.questions.bulkGet(cached.questionIds);
  paper.questions = cached.questionIds.flatMap((qid) => {
    const q = questions.find((row) => row?.id === qid);
    if (!q) return [];
    return [{
      id: q.id,
      prompt: q.question,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      subject_id: q.subject,
      difficulty: q.difficulty,
      age_band: q.ageGroup,
    }];
  });
  return paper;
}

export async function pullExamPacks(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  const papers = await fetchPublishedTests();
  for (const paper of papers) {
    try {
      await fetchExamPaper(paper.id);
    } catch {
      // Keep the catalog row; a later sync can fill questions.
    }
  }
}
