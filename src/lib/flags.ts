/** Feature flags from docs/BUILD_PLAN.md. */

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

/** Challenge / invite on live rooms. Default on when live battle is on. */
export function isInvitesEnabled(): boolean {
  if (!isLiveBattleEnabled()) return false;
  return import.meta.env.VITE_USE_INVITES !== "false";
}

/** JAMB / WAEC / custom exam papers. Default on when Supabase is configured. */
export function isExamModesEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return import.meta.env.VITE_USE_EXAM_MODES !== "false";
}

/** Server-backed global leaderboard. Default on when Supabase is configured. */
export function isServerLeaderboardEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return import.meta.env.VITE_USE_SERVER_LEADERBOARD !== "false";
}
