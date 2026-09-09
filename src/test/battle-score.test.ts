import { describe, expect, it } from "vitest";
import { battleReconnectSeconds, battleTimerRemaining, battleXp, isBattleFinishedStatus } from "@/lib/battle-score";

describe("battleXp", () => {
  it("awards 100 + ceil(secondsLeft * 10) when correct", () => {
    expect(battleXp(10, true)).toBe(200);
    expect(battleXp(0, true)).toBe(100);
    expect(battleXp(3.2, true)).toBe(132);
    expect(battleXp(8, false)).toBe(0);
  });
});

describe("battleTimerRemaining", () => {
  it("counts down from the server startedAt clock", () => {
    const started = "2026-09-09T10:00:00.000Z";
    const startMs = Date.parse(started);
    expect(battleTimerRemaining(started, 10_000, startMs)).toBe(10);
    expect(battleTimerRemaining(started, 10_000, startMs + 2500)).toBe(7.5);
    expect(battleTimerRemaining(started, 10_000, startMs + 12_000)).toBe(0);
  });
});

describe("battleReconnectSeconds", () => {
  it("gives 20s from last seen", () => {
    const last = "2026-09-09T10:00:00.000Z";
    const now = Date.parse(last) + 5_000;
    expect(battleReconnectSeconds(last, now)).toBe(15);
  });
});

describe("isBattleFinishedStatus", () => {
  it("treats complete and forfeit as finished", () => {
    expect(isBattleFinishedStatus("complete")).toBe(true);
    expect(isBattleFinishedStatus("forfeit")).toBe(true);
    expect(isBattleFinishedStatus("active")).toBe(false);
  });
});
