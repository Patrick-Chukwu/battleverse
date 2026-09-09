import { describe, expect, it } from "vitest";
import sampleCsv from "../../docs/admin-import-sample.csv?raw";
import { rpcErrorMessage } from "@/lib/admin-api";
import {
  itemQualityFlag,
  normalizeImportRow,
  parseCsvRecords,
  parseImportText,
  prepareImportRows,
  staleCachedQuestionIds,
  toImportQuestionsRpcArgs,
  type ImportQuestionRow,
} from "@/lib/admin-import";

const valid: ImportQuestionRow = {
  prompt: "What is 2 + 2?",
  option_a: "3",
  option_b: "4",
  option_c: "5",
  option_d: "22",
  correct_index: 1,
  explanation: "2 + 2 = 4",
  subject: "math",
  difficulty: "easy",
  age_band: "6-8",
  exam_type: "casual",
};

describe("normalizeImportRow", () => {
  it("accepts TRD columns and quizData aliases", () => {
    expect(normalizeImportRow(valid, 1).row).toMatchObject({
      prompt: "What is 2 + 2?",
      correct_index: 1,
      subject: "math",
    });
    const aliased = normalizeImportRow(
      {
        question: "What is a loop?",
        options: ["Stop", "Repeat", "Delete", "Paint"],
        correctIndex: 1,
        explanation: "Loops repeat.",
        subject: "tech",
        difficulty: "easy",
        ageGroup: "9-12",
      },
      2
    );
    expect(aliased.row?.prompt).toBe("What is a loop?");
    expect(aliased.row?.option_b).toBe("Repeat");
    expect(aliased.row?.age_band).toBe("9-12");
    expect(aliased.row?.exam_type).toBe("casual");
  });

  it("rejects bad correct_index, subject, and under-specified options", () => {
    expect(normalizeImportRow({ ...valid, correct_index: 4 }, 1).error?.message).toMatch(/correct_index/);
    expect(normalizeImportRow({ ...valid, subject: "history" }, 1).error?.message).toMatch(/subject/);
    expect(normalizeImportRow({ ...valid, option_d: "" }, 1).error?.message).toMatch(/four options/);
  });
});

describe("parseImportText", () => {
  it("parses CSV with quoted commas and reports invalid rows without keeping them", () => {
    const csv = [
      "prompt,option_a,option_b,option_c,option_d,correct_index,explanation,subject,difficulty,age_band,exam_type,topic",
      '"What is CPU, really?",Brain,Fan,Screen,Disk,0,The processor,tech,easy,6-8,casual,hardware',
      "Broken row,only,two,0,nope,math,easy,6-8,casual,",
    ].join("\n");
    const parsed = parseImportText(csv);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].prompt).toBe("What is CPU, really?");
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].row).toBe(2);
  });

  it("parses a JSON array", () => {
    const parsed = parseImportText(JSON.stringify([valid, { ...valid, prompt: "" }]));
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors[0].message).toMatch(/prompt/);
  });

  it("reads CSV headers into records", () => {
    const recs = parseCsvRecords("prompt,subject\nHello,tech\n");
    expect(recs).toEqual([{ prompt: "Hello", subject: "tech" }]);
  });

  it("parses the sample CSV into 20 valid rows with no errors", () => {
    const parsed = parseImportText(sampleCsv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(20);
    expect(parsed.rows.every((row) => row.correct_index >= 0 && row.correct_index <= 3)).toBe(true);
    expect(parsed.rows.some((row) => row.id)).toBe(false);
  });
});

describe("toImportQuestionsRpcArgs", () => {
  it("assigns ids and aliases so import_questions does not need pgcrypto", () => {
    const parsed = parseImportText(sampleCsv);
    const args = toImportQuestionsRpcArgs(parsed.rows);

    expect(args.p_rows).toHaveLength(20);
    for (const row of args.p_rows) {
      expect(row.id).toMatch(/^[a-zA-Z0-9_-]{1,40}$/);
      expect(row.subject_id).toBe(row.subject);
      expect(row.exam_type_id).toBe(row.exam_type);
      expect(row.status).toBe("draft");
      expect(typeof row.correct_index).toBe("number");
      expect(row.option_a).toBeTruthy();
      expect(row.age_band).toMatch(/^(6-8|9-12|13-16|16plus)$/);
    }
    expect(args.p_rows[0]).toMatchObject({
      prompt: "What is 4 + 5?",
      option_b: "9",
      correct_index: 1,
      subject: "math",
      exam_type: "casual",
      topic: "addition",
    });
  });

  it("keeps an explicit id from prepareImportRows", () => {
    const prepared = prepareImportRows([{ ...valid, id: "q_keep_me" }]);
    expect(prepared[0].id).toBe("q_keep_me");
  });
});

describe("rpcErrorMessage", () => {
  it("reads Postgrest-style objects that are not Error instances", () => {
    expect(
      rpcErrorMessage({ message: "function gen_random_bytes(integer) does not exist" }, "Import failed.")
    ).toBe("function gen_random_bytes(integer) does not exist");
    expect(rpcErrorMessage({ message: "" }, "Import failed.")).toBe("Import failed.");
    expect(
      rpcErrorMessage({ message: "token eyJabcdefghijklmnopqrstuvwxyz.abc.def leaked" }, "Import failed.")
    ).toBe("Import failed.");
  });
});

describe("itemQualityFlag", () => {
  it("flags too-easy and too-hard only when n ≥ 30", () => {
    expect(itemQualityFlag(29, 95)).toBeNull();
    expect(itemQualityFlag(30, 91)).toBe("too_easy");
    expect(itemQualityFlag(30, 24)).toBe("too_hard");
    expect(itemQualityFlag(40, 50)).toBeNull();
  });
});

describe("staleCachedQuestionIds", () => {
  it("returns cached ids that are no longer published", () => {
    expect(staleCachedQuestionIds(["a", "b", "c"], ["a", "c"])).toEqual(["b"]);
  });
});
