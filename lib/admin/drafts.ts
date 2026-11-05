import { z } from "zod";
import { refundFakeLead, topUp, type LedgerEntry } from "../credits";
import { ROLES, type Role } from "./roles";

/**
 * Draft changes on the admin desk. Pure functions over one state object.
 *
 * Drafts sit on top of the sample data and never reach the public site, because docs/SECURITY.md
 * bars the dashboard from changing anything until it has a second factor, one account per person,
 * enforced roles and a real audit log. The activity list keeps ids only, never job words.
 */
export type CollectionId = "jobs" | "workers" | "trades" | "deals" | "ads" | "team";
export type DraftRecord = { id: string } & Record<string, unknown>;

export type LogEntry = { at: string; who: Role; did: string; area: string; ref: string };

export type DraftState = {
  changes: Partial<Record<CollectionId, Record<string, DraftRecord | null>>>;
  ledgers: Record<string, LedgerEntry[]>;
  handled: string[];
  role: Role;
  log: LogEntry[];
};

export const EMPTY_DRAFTS: DraftState = { changes: {}, ledgers: {}, handled: [], role: "admin", log: [] };

const MAX_LOG = 200;

const withLog = (state: DraftState, who: LogEntry["who"], entry: Omit<LogEntry, "who">): DraftState["log"] =>
  [{ who, ...entry }, ...state.log].slice(0, MAX_LOG);

/** The seed with drafts applied. New records come first, so what was just added is in view. */
export function merged<T extends DraftRecord>(seed: readonly T[], changes: Record<string, DraftRecord | null> = {}): T[] {
  const seedIds = new Set(seed.map((row) => row.id));
  const created = Object.values(changes).filter((row): row is DraftRecord => row !== null && !seedIds.has(row.id));
  const kept = seed.filter((row) => changes[row.id] !== null).map((row) => (changes[row.id] ?? row) as T);
  return [...(created.reverse() as T[]), ...kept];
}

export function saveRecord(state: DraftState, collection: CollectionId, record: DraftRecord, isNew: boolean, at: string): DraftState {
  return {
    ...state,
    changes: { ...state.changes, [collection]: { ...state.changes[collection], [record.id]: record } },
    log: withLog(state, state.role, { at, did: isNew ? "Created" : "Changed", area: collection, ref: record.id }),
  };
}

export function removeRecords(state: DraftState, collection: CollectionId, ids: readonly string[], seedIds: ReadonlySet<string>, at: string): DraftState {
  const next = { ...state.changes[collection] };
  for (const id of ids) {
    // A record that only ever existed as a draft leaves no trace. A seeded one needs a marker.
    if (seedIds.has(id)) next[id] = null;
    else delete next[id];
  }
  return {
    ...state,
    changes: { ...state.changes, [collection]: next },
    log: withLog(state, state.role, { at, did: "Deleted", area: collection, ref: ids.join(", ") }),
  };
}

export function addCredits(state: DraftState, worker: string, base: readonly LedgerEntry[], key: string, amount: number, at: string): DraftState {
  const current = state.ledgers[worker] ?? base;
  const next = topUp(current, key, amount);
  if (next.length === current.length) return state;
  return {
    ...state,
    ledgers: { ...state.ledgers, [worker]: next },
    log: withLog(state, state.role, { at, did: `Added ${amount} credits`, area: "credits", ref: worker }),
  };
}

export function refundLead(state: DraftState, worker: string, base: readonly LedgerEntry[], jobId: string, at: string): DraftState {
  const current = state.ledgers[worker] ?? base;
  const next = refundFakeLead(current, jobId);
  if (next.length === current.length) return state;
  return {
    ...state,
    ledgers: { ...state.ledgers, [worker]: next },
    log: withLog(state, state.role, { at, did: "Refunded a fake lead", area: "credits", ref: `${worker}, ${jobId}` }),
  };
}

export function toggleHandled(state: DraftState, key: string): DraftState {
  return {
    ...state,
    handled: state.handled.includes(key) ? state.handled.filter((k) => k !== key) : [...state.handled, key],
  };
}

/** Records and ledgers changed. Handled marks and the role preview don't count: they alter no data. */
export function draftCount(state: DraftState) {
  const records = Object.values(state.changes).reduce((sum, rows) => sum + Object.keys(rows ?? {}).length, 0);
  return records + Object.keys(state.ledgers).length;
}

const Stored = z.object({
  changes: z.partialRecord(z.enum(["jobs", "workers", "trades", "deals", "ads", "team"]), z.record(z.string(), z.looseObject({ id: z.string() }).nullable())).default({}),
  ledgers: z.record(z.string(), z.array(z.object({
    key: z.string(),
    kind: z.enum(["top-up", "answer-job", "refund-fake-lead"]),
    amount: z.number().int(),
    jobId: z.string().optional(),
    note: z.string(),
  }))).default({}),
  handled: z.array(z.string()).default([]),
  role: z.enum(ROLES).default("admin"),
  log: z.array(z.object({ at: z.string(), who: z.enum(ROLES), did: z.string(), area: z.string(), ref: z.string() })).default([]),
});

/** Browser storage can hold anything, so a bad value means starting clean rather than crashing. */
export function parseStored(text: string | null): DraftState {
  if (!text) return EMPTY_DRAFTS;
  try {
    const parsed = Stored.safeParse(JSON.parse(text));
    return parsed.success ? (parsed.data as DraftState) : EMPTY_DRAFTS;
  } catch {
    return EMPTY_DRAFTS;
  }
}
