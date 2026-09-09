import { describe, expect, it } from "vitest";
import {
  classifySearchQuery,
  inviteSecondsLeft,
  inviteSharePath,
  inviteShareUrl,
  isUnder13AgeBand,
  normalizePhoneDigits,
} from "@/lib/invite-search";

describe("normalizePhoneDigits", () => {
  it("strips punctuation and a leading 00", () => {
    expect(normalizePhoneDigits("+234 801 234 5678")).toBe("2348012345678");
    expect(normalizePhoneDigits("002348012345678")).toBe("2348012345678");
  });
});

describe("classifySearchQuery", () => {
  it("classifies email, phone, and username", () => {
    expect(classifySearchQuery("Kemi@Family.COM")).toEqual({
      kind: "email",
      query: "kemi@family.com",
    });
    expect(classifySearchQuery("+2348012345678")).toEqual({
      kind: "phone",
      query: "2348012345678",
    });
    expect(classifySearchQuery("cousin_kemi")).toEqual({
      kind: "username",
      query: "cousin_kemi",
    });
  });
});

describe("isUnder13AgeBand", () => {
  it("treats 6-8 and 9-12 as under-13", () => {
    expect(isUnder13AgeBand("6-8")).toBe(true);
    expect(isUnder13AgeBand("9-12")).toBe(true);
    expect(isUnder13AgeBand("13-16")).toBe(false);
    expect(isUnder13AgeBand("16plus")).toBe(false);
    expect(isUnder13AgeBand(null)).toBe(false);
  });
});

describe("inviteSecondsLeft", () => {
  it("counts remaining seconds and floors at 0", () => {
    const now = Date.parse("2026-09-09T10:00:00.000Z");
    expect(inviteSecondsLeft("2026-09-09T10:00:30.000Z", now)).toBe(30);
    expect(inviteSecondsLeft("2026-09-09T09:59:00.000Z", now)).toBe(0);
  });
});

describe("inviteSharePath", () => {
  it("builds a battle deep link", () => {
    expect(inviteSharePath("AB12CD")).toBe("/battle?code=AB12CD");
    expect(inviteShareUrl("AB12CD", "http://localhost:5173")).toBe(
      "http://localhost:5173/battle?code=AB12CD"
    );
  });
});
