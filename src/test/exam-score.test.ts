import { describe, expect, it } from "vitest";
import { examPassed, examPercent, examXp, formatPaperClock } from "@/lib/exam-score";

describe("examXp", () => {
  it("awards a flat 10 when correct", () => {
    expect(examXp(true)).toBe(10);
    expect(examXp(false)).toBe(0);
  });
});

describe("examPassed", () => {
  it("uses the pass mark percentage", () => {
    expect(examPassed(4, 8, 50)).toBe(true);
    expect(examPassed(3, 8, 50)).toBe(false);
    expect(examPassed(7, 8, 80)).toBe(true);
    expect(examPassed(6, 8, 80)).toBe(false);
    expect(examPassed(1, 2, null)).toBe(true);
  });
});

describe("examPercent", () => {
  it("rounds the score", () => {
    expect(examPercent(1, 3)).toBe(33);
    expect(examPercent(0, 0)).toBe(0);
  });
});

describe("formatPaperClock", () => {
  it("formats mm:ss", () => {
    expect(formatPaperClock(600)).toBe("10:00");
    expect(formatPaperClock(65)).toBe("1:05");
    expect(formatPaperClock(0)).toBe("0:00");
  });
});
