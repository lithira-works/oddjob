import { boardJobs, JOB_WHEN, type BoardJob, type JobWhen } from "./data/jobs";
import { providers, type Provider } from "./data/providers";
import { tradeBySlug, trades, type Trade, type TradeGroup } from "./data/trades";

export const TRADE_GROUPS: TradeGroup[] = ["Water and power", "Wood and stone", "Outside", "Inside"];

export const WORKER_SORTS = { nearest: "Nearest", booked: "Most jobs", redone: "Fewest redone" } as const;
export type WorkerSort = keyof typeof WORKER_SORTS;

const matches = (needle: string, ...haystack: (string | undefined)[]) => {
  const query = needle.trim().toLowerCase();
  return !query || haystack.some((text) => text?.toLowerCase().includes(query));
};

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function filterJobs(
  { trade, when, search = "" }: { trade?: string; when?: JobWhen; search?: string },
  list: BoardJob[] = boardJobs,
): BoardJob[] {
  return list.filter(
    (job) =>
      (!trade || job.tradeSlug === trade) &&
      (!when || job.when === when) &&
      matches(search, job.words, job.note, tradeBySlug(job.tradeSlug)?.name),
  );
}

const distance = (worker: Provider) => Number.parseFloat(worker.area);

export function filterWorkers(
  { trade, today = false, search = "", sort = "nearest" }: { trade?: string; today?: boolean; search?: string; sort?: WorkerSort },
  list: Provider[] = providers,
): Provider[] {
  const found = list.filter(
    (worker) =>
      (!trade || worker.tradeSlug === trade) &&
      (!today || worker.arrives.startsWith("Today")) &&
      matches(search, worker.name, worker.about, tradeBySlug(worker.tradeSlug)?.name),
  );
  const order: Record<WorkerSort, (a: Provider, b: Provider) => number> = {
    nearest: (a, b) => distance(a) - distance(b),
    booked: (a, b) => b.booked - a.booked,
    redone: (a, b) => a.redone - b.redone,
  };
  return [...found].sort(order[sort]);
}

/** How many listings each trade has, so a picker can show only what leads somewhere. */
export function countByTrade(items: { tradeSlug: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.tradeSlug] = (counts[item.tradeSlug] ?? 0) + 1;
  return counts;
}

/** Filter settings live in the address, so a filtered list can be linked and works without script. */
export function marketHref(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

export const tradesInGroup = (group: TradeGroup): Trade[] =>
  trades.filter((t) => t.group === group).sort((a, b) => a.name.localeCompare(b.name));

export const parseWhen = (value: string | undefined): JobWhen | undefined =>
  JOB_WHEN.find((when) => when === value);

export const parseSort = (value: string | undefined): WorkerSort =>
  value === "booked" || value === "redone" ? value : "nearest";
