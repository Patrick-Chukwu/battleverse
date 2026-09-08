import { getSupabase } from "@/lib/supabase";
import { isDexieQuestionsEnabled, isServerProfileEnabled } from "@/lib/flags";
import { offlineDb, type OutboxItem } from "@/lib/offline-db";
import { cacheServerQuestions, seedBundledQuestions } from "@/lib/practice-questions";

export async function pendingOutboxCount(): Promise<number> {
  return offlineDb.outbox.where("syncStatus").equals("pending").count();
}

export async function enqueueOutbox(item: Omit<OutboxItem, "syncStatus" | "retries" | "createdAt"> & {
  createdAt?: string;
}): Promise<void> {
  await offlineDb.outbox.put({
    ...item,
    createdAt: item.createdAt ?? new Date().toISOString(),
    retries: 0,
    syncStatus: "pending",
  });
}

export async function pullPublishedQuestions(): Promise<void> {
  if (!isDexieQuestionsEnabled()) return;
  await seedBundledQuestions();
  const supabase = getSupabase();
  if (!supabase || typeof navigator !== "undefined" && !navigator.onLine) return;

  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, options, correct_index, explanation, subject_id, difficulty, age_band, updated_at")
    .eq("status", "published");

  if (error || !data) return;
  await cacheServerQuestions(data as Parameters<typeof cacheServerQuestions>[0]);
}

export async function flushOutbox(): Promise<{ flushed: number; failed: number }> {
  const supabase = getSupabase();
  if (!supabase || !isServerProfileEnabled()) return { flushed: 0, failed: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { flushed: 0, failed: 0 };

  const pending = await offlineDb.outbox.where("syncStatus").equals("pending").toArray();
  let flushed = 0;
  let failed = 0;

  for (const item of pending) {
    const rpc = item.type === "finish" ? "finish_practice" : "submit_attempt";
    const { error } = await supabase.rpc(rpc, { payload: item.payload });
    if (error) {
      failed += 1;
      await offlineDb.outbox.update(item.id, {
        retries: item.retries + 1,
        syncStatus: item.retries + 1 >= 8 ? "error" : "pending",
      });
      continue;
    }
    await offlineDb.outbox.update(item.id, { syncStatus: "synced" });
    flushed += 1;
  }

  return { flushed, failed };
}

export async function syncPractice(): Promise<void> {
  await pullPublishedQuestions();
  await flushOutbox();
}
