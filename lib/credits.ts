/**
 * The provider credit ledger. Balance is always derived from entries and never stored or
 * trusted from a browser. Every entry has an idempotency key, so a retried request or a
 * repeated webhook cannot charge or refund twice. The same rules are enforced in the
 * database by supabase/migrations/0001_init.sql.
 */

export type LedgerKind = "top-up" | "answer-job" | "refund-fake-lead";

export type LedgerEntry = {
  key: string;
  kind: LedgerKind;
  /** Positive adds credits, negative spends them. */
  amount: number;
  jobId?: string;
  note: string;
};

export class InsufficientCreditsError extends Error {
  constructor(public readonly needed: number, public readonly balance: number) {
    super(`Needs ${needed} credits, has ${balance}`);
    this.name = "InsufficientCreditsError";
  }
}

export const balanceOf = (entries: readonly LedgerEntry[]) =>
  entries.reduce((sum, e) => sum + e.amount, 0);

const withEntry = (entries: readonly LedgerEntry[], entry: LedgerEntry): LedgerEntry[] =>
  entries.some((e) => e.key === entry.key) ? [...entries] : [...entries, entry];

export function topUp(entries: readonly LedgerEntry[], key: string, amount: number): LedgerEntry[] {
  if (!Number.isInteger(amount) || amount <= 0) throw new RangeError("Top-up must be a positive whole number");
  return withEntry(entries, { key, kind: "top-up", amount, note: `Added ${amount} credits` });
}

export function answerJob(entries: readonly LedgerEntry[], jobId: string, cost: number): LedgerEntry[] {
  if (!Number.isInteger(cost) || cost <= 0) throw new RangeError("Cost must be a positive whole number");
  const key = `answer:${jobId}`;
  if (entries.some((e) => e.key === key)) return [...entries];
  const balance = balanceOf(entries);
  if (balance < cost) throw new InsufficientCreditsError(cost, balance);
  return [...entries, { key, kind: "answer-job", amount: -cost, jobId, note: `Answered a job for ${cost} credits` }];
}

/** Refunds only a job this provider actually paid for, and only once. */
export function refundFakeLead(entries: readonly LedgerEntry[], jobId: string): LedgerEntry[] {
  const paid = entries.find((e) => e.key === `answer:${jobId}`);
  if (!paid) throw new Error("No payment found for this job");
  return withEntry(entries, {
    key: `refund:${jobId}`,
    kind: "refund-fake-lead",
    amount: -paid.amount,
    jobId,
    note: `Refunded ${-paid.amount} credits for a fake lead`,
  });
}
