import { rpcErrorMessage } from "@/lib/admin-api";
import type { LeaderboardPayload, LeaderboardRow } from "@/lib/leaderboard";
import { offlineDb } from "@/lib/offline-db";
import { getSupabase } from "@/lib/supabase";

const CACHE_KEY = "leaderboardCache";

function isRow(value: unknown): value is LeaderboardRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.username === "string" &&
    typeof row.avatar === "string" &&
    typeof row.xp === "number" &&
    typeof row.level === "number" &&
    typeof row.rank === "number"
  );
}

export function parseLeaderboardPayload(raw: unknown): LeaderboardPayload {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rows = Array.isArray(body.rows) ? body.rows.filter(isRow) : [];
  const you = isRow(body.you) ? body.you : null;
  const captured_at = typeof body.captured_at === "string" ? body.captured_at : new Date().toISOString();
  return { rows, you, captured_at };
}

export async function readCachedLeaderboard(): Promise<LeaderboardPayload | null> {
  const row = await offlineDb.meta.get(CACHE_KEY);
  if (!row?.value) return null;
  try {
    return parseLeaderboardPayload(JSON.parse(row.value));
  } catch {
    return null;
  }
}

export async function cacheLeaderboard(payload: LeaderboardPayload): Promise<void> {
  await offlineDb.meta.put({ key: CACHE_KEY, value: JSON.stringify(payload) });
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardPayload> {
  const supabase = getSupabase();
  const online = typeof navigator === "undefined" || navigator.onLine;
  if (!supabase || !online) {
    const cached = await readCachedLeaderboard();
    if (cached) return cached;
    throw new Error("Leaderboard is offline and no saved board is on this device.");
  }

  const { data, error } = await supabase.rpc("list_leaderboard", { p_limit: limit });
  if (error) {
    const cached = await readCachedLeaderboard();
    if (cached) return cached;
    throw new Error(rpcErrorMessage(error, "Could not load the leaderboard."));
  }
  const payload = parseLeaderboardPayload(data);
  await cacheLeaderboard(payload);
  return payload;
}
