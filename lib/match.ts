import { trades, type Trade } from "./data/trades";

export type MatchResult = {
  trade: Trade | null;
  /** The two people the household should reach before any tradesperson. */
  emergency: "gas" | "fire" | "electric-shock" | null;
  gated: boolean;
};

const EMERGENCIES: { kind: NonNullable<MatchResult["emergency"]>; pattern: RegExp }[] = [
  { kind: "gas", pattern: /\b(smell(s|ing)? (of )?gas|gas (leak|smell)|leaking gas)\b/ },
  { kind: "fire", pattern: /\b(on fire|smoke (is )?coming|burning smell|flames?)\b/ },
  { kind: "electric-shock", pattern: /\b(electric shock|got a shock|electrocut\w*|live wire)\b/ },
];

const normalise = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}/\s-]/gu, " ").replace(/\s+/g, " ").trim();

const containsPhrase = (haystack: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(haystack);
};

/**
 * Finds the trade a household's own words point to. Longer phrases count for more, so
 * "ceiling leak" wins for the roofer even though "leak" alone points to the plumber.
 */
export function matchTrade(text: string): MatchResult {
  const words = normalise(text);
  const emergency = EMERGENCIES.find((e) => e.pattern.test(words))?.kind ?? null;
  if (!words) return { trade: null, emergency, gated: false };

  let best: Trade | null = null;
  let bestScore = 0;
  for (const trade of trades) {
    let score = 0;
    for (const word of trade.words) {
      if (containsPhrase(words, word)) score += word.length * (trade.weight ?? 1);
    }
    if (score > bestScore) {
      best = trade;
      bestScore = score;
    }
  }
  return { trade: best, emergency, gated: Boolean(best?.gated) };
}

/** Splits a sentence into two halves of similar length, keeping whole words. */
export function splitSentence(text: string): [string, string] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["", ""];
  if (words.length === 1) return [words[0]!, ""];
  const total = words.join(" ").length;
  let left = "";
  let i = 0;
  while (i < words.length - 1) {
    const next = left ? `${left} ${words[i]}` : words[i]!;
    if (left && next.length > total / 2) break;
    left = next;
    i++;
  }
  return [left, words.slice(i).join(" ")];
}
