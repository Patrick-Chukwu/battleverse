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

  constructor() {
    super("battleverse-offline");
    this.version(1).stores({
      questions: "id, subject",
      outbox: "id, type, syncStatus, createdAt",
      meta: "key",
    });
  }
}

export const offlineDb = new BattleverseDB();
