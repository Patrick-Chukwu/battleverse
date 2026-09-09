import { describe, expect, it } from "vitest";
import { buildLeaderboardView, podiumOrder, type LeaderboardPayload } from "@/lib/leaderboard";
import { parseLeaderboardPayload } from "@/lib/leaderboard-api";

const row = (id: string, username: string, xp: number, rank: number) => ({
  id,
  username,
  avatar: "🦊",
  xp,
  level: 2,
  rank,
});

describe("buildLeaderboardView", () => {
  it("does not insert a guest as You", () => {
    const payload: LeaderboardPayload = {
      rows: [row("a", "Star", 100, 1)],
      you: null,
      captured_at: "2026-09-09T00:00:00.000Z",
    };
    expect(buildLeaderboardView(payload).every((p) => !p.isYou)).toBe(true);
  });

  it("marks the signed-in player in the top list", () => {
    const you = row("a", "Star", 100, 1);
    const view = buildLeaderboardView({
      rows: [you, row("b", "Other", 80, 2)],
      you,
      captured_at: "2026-09-09T00:00:00.000Z",
    });
    expect(view[0]?.isYou).toBe(true);
    expect(view).toHaveLength(2);
  });

  it("appends you when you are outside the top slice", () => {
    const you = row("z", "Late", 5, 87);
    const view = buildLeaderboardView({
      rows: [row("a", "Star", 100, 1)],
      you,
      captured_at: "2026-09-09T00:00:00.000Z",
    });
    expect(view).toHaveLength(2);
    expect(view[1]).toMatchObject({ id: "z", rank: 87, isYou: true });
  });
});

describe("podiumOrder", () => {
  it("places 2nd, 1st, 3rd for the existing podium chrome", () => {
    expect(podiumOrder(["a", "b", "c"])).toEqual(["b", "a", "c"]);
  });
});

describe("parseLeaderboardPayload", () => {
  it("drops malformed rows and missing you", () => {
    const parsed = parseLeaderboardPayload({
      rows: [{ id: "a", username: "Star", avatar: "🦊", xp: 10, level: 1, rank: 1 }, { nope: true }],
      you: { bad: true },
      captured_at: "t",
    });
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.you).toBeNull();
    expect(parsed.captured_at).toBe("t");
  });
});
