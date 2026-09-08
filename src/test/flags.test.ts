import { describe, expect, it } from "vitest";
import { isServerProfileEnabled, isSupabaseConfigured } from "@/lib/flags";

describe("flags", () => {
  it("treats missing env as guest-only", () => {
    expect(isSupabaseConfigured()).toBe(false);
    expect(isServerProfileEnabled()).toBe(false);
  });
});
