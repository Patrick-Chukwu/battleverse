/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_USE_SERVER_PROFILE: string;
  readonly VITE_USE_DEXIE_QUESTIONS: string;
  readonly VITE_USE_LIVE_BATTLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
