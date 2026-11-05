/**
 * Screens chat messages for contact details before a booking exists.
 * See docs/ANTI-LEAK.md. This is the first layer: it catches honest attempts and common
 * disguises. It warns rather than bans, because false positives anger real users.
 * Run on the server. A browser check alone can be bypassed.
 */

export type ContactReason =
  | "phone-number"
  | "spelled-number"
  | "email"
  | "link"
  | "messaging-app"
  | "off-platform-offer";

export type ScreenResult = {
  flagged: boolean;
  reasons: ContactReason[];
  /** The message with detected details replaced by "[hidden]". */
  redacted: string;
};

const HIDDEN = "[hidden]";

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", oh: "0", nought: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};
const NUMBER_WORD_RUN = new RegExp(
  `\\b(?:${Object.keys(NUMBER_WORDS).join("|")})(?:[\\s,.-]+(?:${Object.keys(NUMBER_WORDS).join("|")})){5,}\\b`,
  "gi",
);

// Digits with optional separators. Long enough to be a phone number.
const DIGIT_RUN = /(?<![\w.])\+?\(?\d(?:[\s().-]{0,3}\d){6,14}(?![\w])/g;
// Numbers followed by these are measurements or money, not phone numbers.
const NOT_A_PHONE_AFTER = /^\s*(mm|cm|m|metres?|meters?|ft|feet|inch(es)?|kg|litres?|liters?|sq|lkr|rs|usd|\$)\b/i;
const NOT_A_PHONE_BEFORE = /(rs\.?|lkr|usd|\$|€|£)\s*$/i;

const EMAIL = /\b[\w.+-]+\s*(?:@|\(at\)|\[at\]|\sat\s)\s*[\w-]+\s*(?:\.|\(dot\)|\[dot\]|\sdot\s)\s*[a-z]{2,}\b/gi;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|net|org|lk|io|co|me|app|info)(?:\/\S*)?\b/gi;
const APPS = /\b(what['’]?s\s?app|wa\.me|viber|telegram|signal app|imo|instagram|insta|facebook|fb|messenger|snapchat|tiktok|wechat|gmail|hotmail|yahoo)\b/gi;
const OFFERS = /\b(call me (directly|on|at)|text me (on|at)|my (number|mobile|cell|phone) is|ring me (on|at)|pay (me )?(in )?cash|outside (of )?(the |this )?(app|site|oddjob)|off (the )?(app|site|platform)|skip (the )?(app|site|fee|oddjob)|avoid (the )?(fee|commission)|without (the )?(app|site|oddjob))\b/gi;

export function screenMessage(input: string): ScreenResult {
  const reasons = new Set<ContactReason>();
  let redacted = input;

  redacted = redacted.replace(EMAIL, () => {
    reasons.add("email");
    return HIDDEN;
  });
  redacted = redacted.replace(LINK, () => {
    reasons.add("link");
    return HIDDEN;
  });
  redacted = redacted.replace(DIGIT_RUN, (match, offset: number, whole: string) => {
    const after = whole.slice(offset + match.length);
    const before = whole.slice(0, offset);
    if (NOT_A_PHONE_AFTER.test(after) || NOT_A_PHONE_BEFORE.test(before)) return match;
    reasons.add("phone-number");
    return HIDDEN;
  });
  redacted = redacted.replace(NUMBER_WORD_RUN, () => {
    reasons.add("spelled-number");
    return HIDDEN;
  });
  redacted = redacted.replace(APPS, () => {
    reasons.add("messaging-app");
    return HIDDEN;
  });
  if (OFFERS.test(input)) reasons.add("off-platform-offer");
  OFFERS.lastIndex = 0;

  return { flagged: reasons.size > 0, reasons: [...reasons], redacted };
}

export const SCREEN_NOTICE =
  "Contact details stay hidden until you book. After that you talk on a masked line, and the job keeps its guarantee and receipt.";
