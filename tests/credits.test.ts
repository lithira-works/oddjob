import { describe, expect, it } from "vitest";
import { answerJob, balanceOf, InsufficientCreditsError, refundFakeLead, topUp, type LedgerEntry } from "@/lib/credits";

const start = (): LedgerEntry[] => topUp([], "first", 10);

describe("credit ledger", () => {
  it("derives the balance from entries", () => {
    expect(balanceOf(answerJob(start(), "job-1", 4))).toBe(6);
  });

  it("refuses to go below zero", () => {
    expect(() => answerJob(start(), "job-1", 11)).toThrow(InsufficientCreditsError);
  });

  it("charges only once for the same job", () => {
    const once = answerJob(start(), "job-1", 4);
    expect(balanceOf(answerJob(once, "job-1", 4))).toBe(6);
  });

  it("applies the same top-up key only once", () => {
    expect(balanceOf(topUp(start(), "first", 10))).toBe(10);
  });

  it("refunds a fake lead once, for the amount paid", () => {
    const paid = answerJob(start(), "job-1", 4);
    const refunded = refundFakeLead(paid, "job-1");
    expect(balanceOf(refunded)).toBe(10);
    expect(balanceOf(refundFakeLead(refunded, "job-1"))).toBe(10);
  });

  it("will not refund a job that was never paid for", () => {
    expect(() => refundFakeLead(start(), "job-9")).toThrow();
  });

  it("rejects non-positive and fractional amounts", () => {
    expect(() => topUp([], "x", -5)).toThrow(RangeError);
    expect(() => answerJob(start(), "j", 0)).toThrow(RangeError);
    expect(() => answerJob(start(), "j", 1.5)).toThrow(RangeError);
  });
});
