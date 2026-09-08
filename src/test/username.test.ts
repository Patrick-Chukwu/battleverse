import { describe, expect, it } from "vitest";
import { isGeneratedUsername, isValidUsername, usernameError } from "@/lib/username";

describe("username", () => {
  it("accepts 3–20 letters, numbers, underscore", () => {
    expect(isValidUsername("pat")).toBe(true);
    expect(isValidUsername("star_coder")).toBe(true);
    expect(isValidUsername("A1")).toBe(false);
    expect(isValidUsername("has-dash")).toBe(false);
    expect(usernameError("ab")).toMatch(/at least 3/);
  });

  it("detects auto-generated handle_new_user names", () => {
    expect(isGeneratedUsername("playera1b2c3")).toBe(true);
    expect(isGeneratedUsername("star_coder")).toBe(false);
  });
});
