import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isExamModesEnabled,
  isInvitesEnabled,
  isLiveBattleEnabled,
  isServerLeaderboardEnabled,
  isServerProfileEnabled,
  isSupabaseConfigured,
} from "@/lib/flags";

describe("flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats missing env as guest-only", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(isServerProfileEnabled()).toBe(false);
    expect(isLiveBattleEnabled()).toBe(false);
    expect(isInvitesEnabled()).toBe(false);
    expect(isExamModesEnabled()).toBe(false);
    expect(isServerLeaderboardEnabled()).toBe(false);
  });

  it("turns invites off when live battle is off", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("VITE_USE_LIVE_BATTLE", "false");
    expect(isInvitesEnabled()).toBe(false);
  });

  it("defaults invites on when live battle is on", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("VITE_USE_LIVE_BATTLE", "true");
    vi.stubEnv("VITE_USE_INVITES", "");
    expect(isInvitesEnabled()).toBe(true);
  });

  it("defaults exam modes on when Supabase is configured", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("VITE_USE_EXAM_MODES", "");
    expect(isExamModesEnabled()).toBe(true);
  });

  it("defaults the server leaderboard on when Supabase is configured", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("VITE_USE_SERVER_LEADERBOARD", "");
    expect(isServerLeaderboardEnabled()).toBe(true);
  });
});
