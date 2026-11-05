/**
 * Sign-in rules that stay true when real accounts arrive. The plan is phone OTP on Supabase,
 * with no passwords. See docs/SECURITY.md. Sending and checking codes happens on the server then.
 */
export const CODE_LENGTH = 6;
export const MAX_CODE_TRIES = 5;

/** Returns the number in international form, or null. Local numbers are read as Sri Lankan mobiles. */
export function normalisePhone(raw: string): string | null {
  const compact = raw.replace(/[\s().-]/g, "");
  const international = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (/^\+[1-9]\d{7,14}$/.test(international)) return international;
  if (/^07\d{8}$/.test(compact)) return `+94${compact.slice(1)}`;
  return null;
}

/** A first name only. Digits and symbols are refused, so a phone number can't pose as a name. */
export function cleanFirstName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return /^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(name) ? name : null;
}

export const isCodeShaped = (code: string) => new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code.trim());

/** Where each side lands after joining. */
export const homeFor = (side: Side) => (side === "worker" ? "/jobs" : "/job");

export type Side = "household" | "worker";
export const parseSide = (value: string | undefined): Side => (value === "worker" ? "worker" : "household");
