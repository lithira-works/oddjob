import { z } from "zod";
import { screenMessage } from "./contact-screen";
import { JOB_WHEN } from "./data/jobs";
import { trades } from "./data/trades";
import { matchTrade } from "./match";

/** Shared by browser and server. The browser's check is for speed. The server's is the one that counts. */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export const safeText = (min: number, max: number) =>
  z.string().trim().min(min).max(max).refine((text) => !CONTROL_CHARACTERS.test(text));

const LOOKS_LIKE_ADDRESS = /\b\d+[a-z]?\s*[,/]?\s*[\p{L}.' -]*\b(road|rd|street|st|lane|ln|avenue|ave|mawatha|mw|place|pl|drive|dr)\b/iu;

const freeOfContact = (text: string) => !screenMessage(text).flagged;

const JobInput = z.strictObject({
  words: safeText(2, 500).refine(freeOfContact),
  area: safeText(0, 60).refine(freeOfContact).refine((text) => !LOOKS_LIKE_ADDRESS.test(text)),
  when: z.enum(JOB_WHEN),
  trade: z.string().refine((slug) => slug === "" || trades.some((t) => t.slug === slug && !t.gated)),
});
export type JobFields = z.infer<typeof JobInput>;

const MESSAGES: Record<keyof JobFields, string> = {
  words: "Say what’s wrong in a few words. Please leave out phone numbers, emails and links.",
  area: "Give a neighbourhood only: no house number, street, phone number or link.",
  when: "Choose when you need this done.",
  trade: "Choose a trade from the list.",
};

export type JobErrors = Partial<Record<keyof JobFields, string>>;

export function validateJob(input: unknown): { ok: true; data: JobFields } | { ok: false; errors: JobErrors } {
  const parsed = JobInput.safeParse(input);
  if (!parsed.success) {
    const errors: JobErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field in MESSAGES) errors[field as keyof JobFields] = MESSAGES[field as keyof JobFields];
    }
    return { ok: false, errors: Object.keys(errors).length > 0 ? errors : { words: MESSAGES.words } };
  }
  // Care work stays blocked here as well as in the page, whatever trade was sent.
  if (matchTrade(parsed.data.words).gated) {
    return { ok: false, errors: { words: "Care work opens after identity, reference and police checks are in place." } };
  }
  return { ok: true, data: parsed.data };
}
