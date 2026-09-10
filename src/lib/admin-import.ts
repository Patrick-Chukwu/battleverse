export const ADMIN_SUBJECTS = ["tech", "ai", "math", "general", "bible", "english"] as const;
export const ADMIN_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const ADMIN_AGE_BANDS = ["6-8", "9-12", "13-16", "16plus"] as const;
export const ADMIN_EXAM_TYPES = ["casual", "jamb", "waec", "custom"] as const;
export const ADMIN_QUESTION_STATUSES = ["draft", "published", "archived"] as const;
export const ADMIN_TEST_STATUSES = ["draft", "published", "archived"] as const;

export type AdminSubject = (typeof ADMIN_SUBJECTS)[number];
export type AdminDifficulty = (typeof ADMIN_DIFFICULTIES)[number];
export type AdminAgeBand = (typeof ADMIN_AGE_BANDS)[number];
export type AdminExamType = (typeof ADMIN_EXAM_TYPES)[number];
export type AdminQuestionStatus = (typeof ADMIN_QUESTION_STATUSES)[number];

export interface ImportQuestionRow {
  id?: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  explanation: string;
  subject: AdminSubject;
  difficulty: AdminDifficulty;
  age_band: AdminAgeBand;
  exam_type: AdminExamType;
  topic?: string;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportParseResult {
  rows: ImportQuestionRow[];
  errors: ImportError[];
}

const SUBJECT_SET = new Set<string>(ADMIN_SUBJECTS);
const DIFF_SET = new Set<string>(ADMIN_DIFFICULTIES);
const AGE_SET = new Set<string>(ADMIN_AGE_BANDS);
const EXAM_SET = new Set<string>(ADMIN_EXAM_TYPES);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function parseCorrectIndex(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw.trim());
    if (Number.isInteger(n)) return n;
  }
  return null;
}

export function generateQuestionId(prompt = ""): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `q_${slug || "item"}_${rand}`;
}

export function normalizeImportRow(raw: unknown, index: number): { row?: ImportQuestionRow; error?: ImportError } {
  const rec = asRecord(raw);
  if (!rec) return { error: { row: index, message: "Row must be an object." } };

  const options = Array.isArray(rec.options) ? rec.options.map((item) => String(item ?? "").trim()) : null;
  const prompt = pickString(rec, "prompt", "question");
  const optionA = options?.[0] ?? pickString(rec, "option_a", "optionA");
  const optionB = options?.[1] ?? pickString(rec, "option_b", "optionB");
  const optionC = options?.[2] ?? pickString(rec, "option_c", "optionC");
  const optionD = options?.[3] ?? pickString(rec, "option_d", "optionD");
  const explanation = pickString(rec, "explanation");
  const subject = pickString(rec, "subject", "subject_id").toLowerCase();
  const difficulty = pickString(rec, "difficulty").toLowerCase() || "easy";
  const ageBand = pickString(rec, "age_band", "ageGroup", "age_group");
  const examType = pickString(rec, "exam_type", "exam_type_id", "examType").toLowerCase() || "casual";
  const topic = pickString(rec, "topic") || undefined;
  const id = pickString(rec, "id") || undefined;
  const correctIndex = parseCorrectIndex(rec.correct_index ?? rec.correctIndex);

  if (!prompt) return { error: { row: index, message: "Missing prompt." } };
  if (!optionA || !optionB || !optionC || !optionD) {
    return { error: { row: index, message: "Need four options (option_a–d)." } };
  }
  if (correctIndex === null || correctIndex < 0 || correctIndex > 3) {
    return { error: { row: index, message: "correct_index must be 0, 1, 2, or 3." } };
  }
  if (!SUBJECT_SET.has(subject)) {
    return { error: { row: index, message: `Unknown subject "${subject}".` } };
  }
  if (!DIFF_SET.has(difficulty)) {
    return { error: { row: index, message: `Unknown difficulty "${difficulty}".` } };
  }
  if (!AGE_SET.has(ageBand)) {
    return { error: { row: index, message: `Unknown age_band "${ageBand}".` } };
  }
  if (!EXAM_SET.has(examType)) {
    return { error: { row: index, message: `Unknown exam_type "${examType}".` } };
  }
  if (id && !/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
    return { error: { row: index, message: "id must be 1–40 letters, numbers, _ or -." } };
  }

  return {
    row: {
      id,
      prompt,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_index: correctIndex,
      explanation,
      subject: subject as AdminSubject,
      difficulty: difficulty as AdminDifficulty,
      age_band: ageBand as AdminAgeBand,
      exam_type: examType as AdminExamType,
      topic,
    },
  };
}

export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((cells) => cells.some((c) => c.trim() !== "")).map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((header, i) => {
      rec[header] = cells[i] ?? "";
    });
    return rec;
  });
}

export function parseCsvRows(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Rows ready for `import_questions`. Always include an id so the RPC never needs pgcrypto. */
export function prepareImportRows(rows: ImportQuestionRow[]): ImportQuestionRow[] {
  return rows.map((row) => ({
    ...row,
    id: row.id || generateQuestionId(row.prompt),
    topic: row.topic || undefined,
  }));
}

/** Named args for `import_questions(p_rows jsonb)`. Every row has id + both subject aliases. */
export function toImportQuestionsRpcArgs(rows: ImportQuestionRow[]): { p_rows: Record<string, unknown>[] } {
  return {
    p_rows: prepareImportRows(rows).map((row) => ({
      id: row.id,
      prompt: row.prompt,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      option_d: row.option_d,
      correct_index: row.correct_index,
      explanation: row.explanation,
      subject: row.subject,
      subject_id: row.subject,
      difficulty: row.difficulty,
      age_band: row.age_band,
      exam_type: row.exam_type,
      exam_type_id: row.exam_type,
      topic: row.topic ?? "",
      status: "draft",
    })),
  };
}

export function parseImportText(raw: string): ImportParseResult {
  const text = raw.trim();
  if (!text) return { rows: [], errors: [{ row: 0, message: "Nothing to import." }] };

  let records: unknown[] = [];
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      records = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { rows: [], errors: [{ row: 0, message: "JSON is not valid." }] };
    }
  } else {
    records = parseCsvRecords(text);
    if (records.length === 0) {
      return { rows: [], errors: [{ row: 0, message: "CSV needs a header row and at least one data row." }] };
    }
  }

  const rows: ImportQuestionRow[] = [];
  const errors: ImportError[] = [];
  records.forEach((record, i) => {
    const result = normalizeImportRow(record, i + 1);
    if (result.error) errors.push(result.error);
    else if (result.row) rows.push(result.row);
  });
  return { rows, errors };
}

export function itemQualityFlag(
  attempts: number,
  pctCorrect: number | null
): "too_easy" | "too_hard" | null {
  if (attempts < 30 || pctCorrect == null) return null;
  if (pctCorrect > 90) return "too_easy";
  if (pctCorrect < 25) return "too_hard";
  return null;
}

export function staleCachedQuestionIds(cachedIds: string[], publishedIds: string[]): string[] {
  const published = new Set(publishedIds);
  return cachedIds.filter((id) => !published.has(id));
}
