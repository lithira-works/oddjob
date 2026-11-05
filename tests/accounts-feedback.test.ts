import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanFirstName, homeFor, isCodeShaped, normalisePhone, parseSide } from "@/lib/auth";
import { FeedbackInput } from "@/lib/feedback";
import { MAX_FILE_BYTES, saveFeedback } from "@/lib/feedback-store";

describe("normalisePhone", () => {
  it("reads local Sri Lankan mobiles", () => {
    expect(normalisePhone("071 234 5678")).toBe("+94712345678");
    expect(normalisePhone("071-234-5678")).toBe("+94712345678");
  });
  it("keeps international numbers", () => {
    expect(normalisePhone("+94 71 234 5678")).toBe("+94712345678");
    expect(normalisePhone("0094712345678")).toBe("+94712345678");
    expect(normalisePhone("+447911123456")).toBe("+447911123456");
  });
  it("refuses anything else", () => {
    for (const bad of ["", "12345", "011 234 5678", "+0712345678", "call me", "071234567x"]) {
      expect(normalisePhone(bad)).toBeNull();
    }
  });
});

describe("cleanFirstName", () => {
  it("accepts names, with their letters intact", () => {
    expect(cleanFirstName("  Amal ")).toBe("Amal");
    expect(cleanFirstName("Anne-Marie")).toBe("Anne-Marie");
    expect(cleanFirstName("නිමල්")).toBe("නිමල්");
  });
  it("refuses numbers, symbols and blanks", () => {
    for (const bad of ["", "   ", "0712345678", "a@b", "<script>", "x".repeat(41)]) {
      expect(cleanFirstName(bad)).toBeNull();
    }
  });
});

describe("codes and sides", () => {
  it("wants six digits", () => {
    expect(isCodeShaped("123456")).toBe(true);
    expect(isCodeShaped(" 123456 ")).toBe(true);
    expect(isCodeShaped("12345")).toBe(false);
    expect(isCodeShaped("12345a")).toBe(false);
  });
  it("defaults to household, and sends each side home", () => {
    expect(parseSide("worker")).toBe("worker");
    expect(parseSide("admin")).toBe("household");
    expect(parseSide(undefined)).toBe("household");
    expect(homeFor("worker")).toBe("/jobs");
    expect(homeFor("household")).toBe("/job");
  });
});

describe("feedback", () => {
  let folder: string | undefined;
  afterEach(async () => {
    if (folder) await rm(folder, { recursive: true, force: true });
    folder = undefined;
  });

  it("validates kind and length, and refuses extra fields", () => {
    const good = { kind: "idea", message: "Add a map of nearby jobs." };
    expect(FeedbackInput.safeParse(good).success).toBe(true);
    expect(FeedbackInput.safeParse({ ...good, kind: "spam" }).success).toBe(false);
    expect(FeedbackInput.safeParse({ ...good, message: "   short   " }).success).toBe(false);
    expect(FeedbackInput.safeParse({ ...good, message: "x".repeat(1001) }).success).toBe(false);
    expect(FeedbackInput.safeParse({ ...good, ip: "1.2.3.4" }).success).toBe(false);
  });

  it("appends one line per entry", async () => {
    folder = await mkdtemp(path.join(tmpdir(), "oddjob-feedback-"));
    const at = new Date("2026-11-05T00:00:00Z");
    await saveFeedback({ kind: "idea", message: "First idea here" }, folder, at);
    await saveFeedback({ kind: "problem", message: "Second problem here" }, folder, at);
    const lines = (await readFile(path.join(folder, "feedback.jsonl"), "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]!)).toEqual({ at: at.toISOString(), kind: "problem", message: "Second problem here" });
  });

  it("refuses to grow past the size cap", async () => {
    folder = await mkdtemp(path.join(tmpdir(), "oddjob-feedback-"));
    await writeFile(path.join(folder, "feedback.jsonl"), "x".repeat(MAX_FILE_BYTES));
    await expect(saveFeedback({ kind: "idea", message: "One too many" }, folder)).rejects.toThrow("full");
  });
});
