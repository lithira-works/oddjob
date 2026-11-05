"use client";

import { merged, type DraftRecord, type DraftState } from "@/lib/admin/drafts";
import { boardJobs } from "@/lib/data/jobs";
import { offers } from "@/lib/data/offers";
import { providers } from "@/lib/data/providers";
import { trades } from "@/lib/data/trades";

/** Sample data with the admin-only status each list needs. Shared so counts match across tabs. */
export const jobSeed = boardJobs.map((job) => ({ ...job, status: "Open" })) as (typeof boardJobs[number] & { status: string })[];
export const workerSeed = providers.map((p) => ({ ...p, id: p.slug, status: "Listed" }));
export const tradeSeed = trades.map((t) => ({ ...t, id: t.slug }));
export const dealSeed = offers.map((o) => ({ ...o, status: "Live" }));

export type JobRow = (typeof jobSeed)[number];
export type WorkerRow = (typeof workerSeed)[number];
export type TradeRow = (typeof tradeSeed)[number];
export type DealRow = (typeof dealSeed)[number];

const asRecords = <T,>(rows: readonly T[]) => rows as unknown as readonly DraftRecord[];

export const allJobs = (d: DraftState) => merged(asRecords(jobSeed), d.changes.jobs) as unknown as JobRow[];
export const allWorkers = (d: DraftState) => merged(asRecords(workerSeed), d.changes.workers) as unknown as WorkerRow[];
export const allTrades = (d: DraftState) => merged(asRecords(tradeSeed), d.changes.trades) as unknown as TradeRow[];
export const allDeals = (d: DraftState) => merged(asRecords(dealSeed), d.changes.deals) as unknown as DealRow[];

export const openTradeSlugs = (d: DraftState) => allTrades(d).filter((t) => !t.gated).map((t) => t.slug);
export const tradeLabel = (t: { service?: string; name: string }) => {
  const text = t.service ?? t.name;
  return text.charAt(0).toUpperCase() + text.slice(1);
};
