import { z } from "zod";
import { AD_SLOTS, isSafeAd, type Ad, type AdSlotId } from "../data/ads";
import { JOB_WHEN } from "../data/jobs";
import { OFFER_KINDS } from "../data/offers";
import { trades, type TradeGroup } from "../data/trades";
import { matchTrade } from "../match";
import { freeOfContact, LOOKS_LIKE_ADDRESS, safeText } from "../validation";
import { ROLES } from "./roles";

/**
 * What the admin forms accept. These rules hold whoever is editing: no contact details in job
 * text, no addresses, no care work through a side door, no ad that breaks the ad rules.
 * Replies, booked jobs, ID checks and balances are worked out from real events, so no form
 * here can set them.
 */
export type Values = Record<string, string>;
export type Errors = Record<string, string>;
export type Checked = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Errors };

export const TRADE_GROUPS: readonly TradeGroup[] = ["Water and power", "Wood and stone", "Outside", "Inside"];
export const JOB_STATUS = ["Open", "Closed"] as const;
export const WORKER_STATUS = ["Listed", "Paused"] as const;
export const DEAL_STATUS = ["Live", "Paused"] as const;

/** Credited pictures only. A new one needs entries in lib/data/credits.json and docs/CREDITS.md first. */
export const TRADE_PICTURES = [...new Map(trades.map((t) => [t.image, t.imageAlt])).entries()].map(([image, alt]) => ({ image, alt }));

const CARE_MESSAGE = "Care work stays closed until the checks in docs/SECURITY.md exist.";
const isCareWork = (text: string) => Boolean(matchTrade(text).gated);

const clean = (min: number, max: number) => safeText(min, max).refine(freeOfContact);
const whole = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

function check<S extends z.ZodType>(schema: S, messages: Errors, values: Values): { ok: true; data: z.infer<S> } | { ok: false; errors: Errors } {
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Errors = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "");
    errors[field] = messages[field] ?? "Check this field.";
  }
  return { ok: false, errors };
}

const JobForm = z.object({
  words: clean(2, 120),
  note: clean(0, 240),
  tradeSlug: z.string(),
  area: clean(1, 60).refine((text) => !LOOKS_LIKE_ADDRESS.test(text)),
  when: z.enum(JOB_WHEN),
  cost: whole(1, 10),
  status: z.enum(JOB_STATUS),
});

export function checkJob(values: Values, openTrades: readonly string[]): Checked {
  const result = check(JobForm, {
    words: "Say what’s wrong in 2 to 120 characters, with no phone numbers, emails or links.",
    note: "Keep it under 240 characters, with no phone numbers, emails or links.",
    area: "Give a rough area only: no house number, street, phone number or link.",
    cost: "Use a whole number of credits from 1 to 10.",
  }, values);
  if (!result.ok) return result;
  const errors: Errors = {};
  if (!openTrades.includes(result.data.tradeSlug)) errors.tradeSlug = "Choose an open trade.";
  if (isCareWork(result.data.words)) errors.words = CARE_MESSAGE;
  return Object.keys(errors).length ? { ok: false, errors } : result;
}

const WorkerForm = z.object({
  name: clean(2, 40),
  tradeSlug: z.string(),
  area: clean(1, 60).refine((text) => !LOOKS_LIKE_ADDRESS.test(text)),
  years: whole(0, 70),
  about: clean(2, 240),
  quote: whole(0, 10_000_000),
  arrives: clean(2, 40),
  status: z.enum(WORKER_STATUS),
});

export function checkWorker(values: Values, openTrades: readonly string[]): Checked {
  const result = check(WorkerForm, {
    name: "Use 2 to 40 characters, with no contact details.",
    area: "Give a rough area only: no house number, street, phone number or link.",
    years: "Use a whole number from 0 to 70.",
    about: "Use 2 to 240 characters, with no contact details.",
    quote: "Use a whole number, with no commas.",
    arrives: "Say when they can come, in a few words.",
  }, values);
  if (!result.ok) return result;
  if (!openTrades.includes(result.data.tradeSlug)) return { ok: false, errors: { tradeSlug: "Choose an open trade." } };
  return result;
}

const list = (text: string) => text.split(",").map((word) => word.trim().toLowerCase()).filter(Boolean);

const TradeForm = z.object({
  name: safeText(2, 40),
  service: safeText(0, 40),
  article: z.enum(["a", "an"]),
  group: z.enum(TRADE_GROUPS as [TradeGroup, ...TradeGroup[]]),
  jobs: safeText(2, 80),
  image: z.enum(TRADE_PICTURES.map((p) => p.image) as [string, ...string[]]),
  words: safeText(2, 800),
  featured: z.enum(["Yes", "No"]),
});

export const slugFrom = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function checkTrade(values: Values, takenSlugs: readonly string[], currentId?: string): Checked {
  const result = check(TradeForm, {
    name: "Use 2 to 40 characters. It reads after “a job for a”.",
    jobs: "List some typical jobs, in up to 80 characters.",
    image: "Choose a credited picture.",
    words: "Add the words a household might use, separated by commas.",
  }, values);
  if (!result.ok) return result;
  const { name, words, featured, image, service, ...rest } = result.data;
  const errors: Errors = {};
  const wordList = list(words);
  if (isCareWork(name) || isCareWork(service)) errors.name = CARE_MESSAGE;
  if (wordList.some(isCareWork)) errors.words = CARE_MESSAGE;
  const id = currentId ?? slugFrom(name);
  if (!currentId && takenSlugs.includes(id)) errors.name = "That trade already exists.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      ...rest, id, slug: id, name, image,
      ...(service ? { service } : {}),
      imageAlt: TRADE_PICTURES.find((p) => p.image === image)?.alt ?? "",
      words: wordList,
      featured: featured === "Yes",
    },
  };
}

const DealForm = z.object({
  kind: z.enum(OFFER_KINDS),
  amount: clean(1, 10),
  title: clean(2, 60),
  terms: clean(2, 140),
  tradeSlug: z.string(),
  providerSlug: z.string(),
  status: z.enum(DEAL_STATUS),
});

export function checkDeal(values: Values, openTrades: readonly string[], people: readonly string[]): Checked {
  const result = check(DealForm, {
    amount: "Keep it to 10 characters. It’s set large.",
    title: "Use 2 to 60 characters, with no contact details.",
    terms: "Use 2 to 140 characters, with no contact details.",
  }, values);
  if (!result.ok) return result;
  const errors: Errors = {};
  if (!openTrades.includes(result.data.tradeSlug)) errors.tradeSlug = "Choose an open trade.";
  if (!people.includes(result.data.providerSlug)) errors.providerSlug = "Choose who’s offering it.";
  return Object.keys(errors).length ? { ok: false, errors } : result;
}

const isDay = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text);

const AdForm = z.object({
  slot: z.enum(Object.keys(AD_SLOTS) as [AdSlotId, ...AdSlotId[]]),
  advertiser: clean(2, 60),
  href: z.string().trim().max(300),
  image: z.string().trim().max(200),
  imagePhone: z.string().trim().max(200),
  alt: clean(2, 160),
  from: z.string().refine(isDay),
  until: z.string().refine(isDay),
});

/** The same safety check the public banner runs, plus no double booking and no care work. */
export function checkAd(values: Values, others: readonly Pick<Ad, "slot" | "from" | "until">[]): Checked {
  const result = check(AdForm, {
    advertiser: "Use 2 to 60 characters. Every ad names its advertiser.",
    alt: "Say what the picture shows, in 2 to 160 characters.",
    from: "Choose the first day.",
    until: "Choose the last day.",
  }, values);
  if (!result.ok) return result;
  const ad = result.data;
  const errors: Errors = {};
  const safe = isSafeAd(ad);
  if (!safe) {
    if (!/^https:\/\//.test(ad.href)) errors.href = "The link must start with https://.";
    if (!ad.image.startsWith("/ads/") || ad.image.includes("..")) errors.image = "Use our own picture, with a path under /ads/.";
    if (!ad.imagePhone.startsWith("/ads/") || ad.imagePhone.includes("..")) errors.imagePhone = "Use our own picture, with a path under /ads/.";
    if (Object.keys(errors).length === 0) errors.href = "That link isn’t valid.";
  }
  if (ad.from > ad.until) errors.until = "The last day can’t be before the first.";
  if (others.some((o) => o.slot === ad.slot && o.from <= ad.until && ad.from <= o.until)) errors.from = "That space is booked for some of these days.";
  if (isCareWork(`${ad.advertiser} ${ad.alt}`)) errors.advertiser = "No ads for care work while it’s closed.";
  return Object.keys(errors).length ? { ok: false, errors } : result;
}

const TeamForm = z.object({
  name: clean(2, 60),
  email: z.email().max(254),
  role: z.enum(ROLES),
});

export const checkTeam = (values: Values): Checked =>
  check(TeamForm, { name: "Use 2 to 60 characters.", email: "Enter a work email." }, values);
