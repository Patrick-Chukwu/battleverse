/** Feature flags. Practice uses Dexie when Supabase is configured (Phase 2). */

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/** Server profile hydrate/save. Off when unset env, or when VITE_USE_SERVER_PROFILE=false. */
export function isServerProfileEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return import.meta.env.VITE_USE_SERVER_PROFILE !== "false";
}

/** Dexie question cache + attempt outbox. Default on when Supabase is configured. */
export function isDexieQuestionsEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return import.meta.env.VITE_USE_DEXIE_QUESTIONS !== "false";
}

/** Live matchmaking + realtime rooms. Default on when Supabase is configured. Off → local bots. */
export function isLiveBattleEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return import.meta.env.VITE_USE_LIVE_BATTLE !== "false";
}
