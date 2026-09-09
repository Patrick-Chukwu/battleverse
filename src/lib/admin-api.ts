import { getSupabase } from "@/lib/supabase";
import {
  toImportQuestionsRpcArgs,
  type AdminAgeBand,
  type AdminDifficulty,
  type AdminExamType,
  type AdminQuestionStatus,
  type AdminSubject,
  type ImportQuestionRow,
} from "@/lib/admin-import";

/** Postgrest errors are often plain objects, not `Error`. Never leak keys/JWTs. */
export function rpcErrorMessage(err: unknown, fallback: string): string {
  let message = fallback;
  if (typeof err === "string" && err.trim()) message = err.trim();
  else if (err instanceof Error && err.message.trim()) message = err.message.trim();
  else if (err && typeof err === "object" && "message" in err) {
    const raw = (err as { message: unknown }).message;
    if (typeof raw === "string" && raw.trim()) message = raw.trim();
  }
  if (/service_role|anon[_ ]?key|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./i.test(message)) {
    return fallback;
  }
  return message;
}

function throwRpc(err: unknown, fallback: string): never {
  throw new Error(rpcErrorMessage(err, fallback));
}

export interface AdminQuestionDto {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  subject_id: AdminSubject;
  topic_id: string | null;
  exam_type_id: AdminExamType;
  difficulty: AdminDifficulty;
  age_band: AdminAgeBand;
  status: AdminQuestionStatus;
  created_by: string | null;
  updated_at: string;
}

export interface AdminQuestionFilters {
  subject_id?: string;
  exam_type_id?: string;
  difficulty?: string;
  age_band?: string;
  status?: string;
  q?: string;
}

export interface AdminTestDto {
  id: string;
  title: string;
  exam_type_id: AdminExamType;
  subject_ids: string[];
  question_count: number;
  time_limit_s: number | null;
  pass_mark_pct: number | null;
  hints_allowed: boolean;
  offline_pack: boolean;
  status: "draft" | "published" | "archived";
  updated_at: string;
  question_ids: string[];
}

export interface AdminStatDto {
  id: string;
  prompt: string;
  subject_id: AdminSubject;
  exam_type_id: AdminExamType;
  status: AdminQuestionStatus;
  attempts: number;
  correct: number;
  timeouts: number;
  pct_correct: number | null;
  timeout_rate: number | null;
  flag: "too_easy" | "too_hard" | null;
}

export interface ImportQuestionsResult {
  imported: number;
  errors: { row: number; message: string }[];
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function rpcAdminListQuestions(filters: AdminQuestionFilters = {}): Promise<AdminQuestionDto[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_list_questions", { p_filters: filters });
  if (error) throwRpc(error, "Could not load questions.");
  return (data ?? []) as AdminQuestionDto[];
}

export async function rpcAdminUpsertQuestion(payload: Record<string, unknown>): Promise<AdminQuestionDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_upsert_question", { p_question: payload });
  if (error) throwRpc(error, "Could not save question.");
  return data as AdminQuestionDto;
}

export async function rpcAdminSetQuestionStatus(
  id: string,
  status: AdminQuestionStatus
): Promise<AdminQuestionDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_set_question_status", { p_id: id, p_status: status });
  if (error) throwRpc(error, "Could not update status.");
  return data as AdminQuestionDto;
}

export async function rpcImportQuestions(rows: ImportQuestionRow[]): Promise<ImportQuestionsResult> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("import_questions", toImportQuestionsRpcArgs(rows));
  if (error) throwRpc(error, "Import failed.");
  const raw = (data ?? { imported: 0, errors: [] }) as ImportQuestionsResult;
  return { imported: raw.imported ?? 0, errors: raw.errors ?? [] };
}

export async function rpcAdminListTests(): Promise<AdminTestDto[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_list_tests");
  if (error) throwRpc(error, "Could not load tests.");
  return (data ?? []) as AdminTestDto[];
}

export async function rpcAdminUpsertTest(payload: Record<string, unknown>): Promise<AdminTestDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_upsert_test", { p_test: payload });
  if (error) throwRpc(error, "Could not save test.");
  return data as AdminTestDto;
}

export async function rpcAdminQuestionStats(): Promise<AdminStatDto[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("admin_question_stats");
  if (error) throwRpc(error, "Could not load stats.");
  return (data ?? []) as AdminStatDto[];
}
