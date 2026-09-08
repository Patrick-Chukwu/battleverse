import { describe, expect, it } from "vitest";
import { practiceLevel, practiceXp } from "@/lib/practice-score";

describe("practiceXp", () => {
  it("awards 10 + 2 per remaining second when correct", () => {
    expect(practiceXp(15, true)).toBe(40);
    expect(practiceXp(0, true)).toBe(10);
    expect(practiceXp(8, false)).toBe(0);
  });
});

describe("practiceLevel", () => {
  it("matches the existing client thresholds", () => {
    expect(practiceLevel(0)).toBe(1);
    expect(practiceLevel(100)).toBe(2);
    expect(practiceLevel(4000)).toBe(8);
  });
});
