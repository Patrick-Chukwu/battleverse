import { describe, expect, it } from "vitest";
import { questions, type Subject } from "@/data/quizData";

const SUBJECTS: Subject[] = ["tech", "ai", "math", "general"];
const BANDS = ["6-8", "9-12", "13-16"] as const;

describe("question coverage for live battles", () => {
  it("has at least 5 published items per subject and age band", () => {
    for (const subject of SUBJECTS) {
      for (const band of BANDS) {
        const n = questions.filter((q) => q.subject === subject && q.ageGroup === band).length;
        expect(n, `${subject} ${band}`).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
