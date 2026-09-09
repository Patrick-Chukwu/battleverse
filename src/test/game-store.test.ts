import { describe, expect, it } from "vitest";
import { defaultProfile, normalizeProfile } from "@/store/gameStore";

describe("normalizeProfile", () => {
  it("replaces null or missing persist snapshots with defaults", () => {
    expect(normalizeProfile(null)).toEqual(defaultProfile);
    expect(normalizeProfile(undefined)).toEqual(defaultProfile);
    expect(normalizeProfile({})).toEqual(defaultProfile);
  });

  it("keeps valid fields and fills the rest", () => {
    expect(normalizeProfile({ name: "Kemi", xp: 120, earnedBadges: ["first-win", 1] })).toMatchObject({
      name: "Kemi",
      avatar: "🦊",
      xp: 120,
      earnedBadges: ["first-win"],
    });
  });
});
