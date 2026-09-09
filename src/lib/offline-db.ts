import Dexie, { type Table } from "dexie";
import type { Question, Subject } from "@/data/quizData";

export type OutboxType = "attempt" | "finish" | "invite_send";
export type SyncStatus = "pending" | "synced" | "error";

export interface CachedQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  subject: Subject;
  difficulty: Question["difficulty"];
  ageGroup: Question["ageGroup"];
  updatedAt: string;
}

export interface CachedExamPaper {
  id: string;
  title: string;
  examTypeId: string;
  subjectIds: string[];
  questionCount: number;
  timeLimitS: number | null;
  passMarkPct: number | null;
  hintsAllowed: boolean;
  offlinePack: boolean;
  questionIds: string[];
  updatedAt: string;
}

export interface OutboxItem {
  id: string;
  type: OutboxType;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
  syncStatus: SyncStatus;
}

export interface MetaRow {
  key: string;
  value: string;
}

class BattleverseDB extends Dexie {
  questions!: Table<CachedQuestion, string>;
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaRow, string>;
  tests!: Table<CachedExamPaper, string>;

  constructor() {
    super("battleverse-offline");
    this.version(1).stores({
      questions: "id, subject",
      outbox: "id, type, syncStatus, createdAt",
      meta: "key",
    });
    this.version(2).stores({
      questions: "id, subject",
      outbox: "id, type, syncStatus, createdAt",
      meta: "key",
      tests: "id, examTypeId, offlinePack",
    });
  }
}

export const offlineDb = new BattleverseDB();
