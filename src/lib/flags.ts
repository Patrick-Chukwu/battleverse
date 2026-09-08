/** Feature flags from docs/BUILD_PLAN.md. Practice still reads quizData.ts until Phase 2. */

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
