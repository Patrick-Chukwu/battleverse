import { afterEach, describe, expect, it, vi } from "vitest";
import { isServerProfileEnabled, isSupabaseConfigured } from "@/lib/flags";

describe("flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats missing env as guest-only", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(isServerProfileEnabled()).toBe(false);
  });
});
