import { z } from "zod";
import { cleanFirstName } from "./auth";

/**
 * Identity check rules, shared by browser and server. These catch mistakes and obvious fakes.
 * They can't prove a document is genuine or belongs to the person: that takes a trained reviewer
 * or a verification vendor. See docs/SECURITY.md.
 */
export const DOC_TYPES = {
  nic: { label: "National ID card", back: true, hint: "12 digits, or 9 digits and a letter" },
  licence: { label: "Driving licence", back: true, hint: "As printed on your licence" },
  passport: { label: "Passport", back: false, hint: "As printed on the photo page" },
} as const;
export type DocType = keyof typeof DOC_TYPES;

export const MIN_AGE = 18;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MIN_IMAGE_SIDE = 600;
export const MAX_REQUEST_BYTES = 3 * MAX_IMAGE_BYTES + 64 * 1024;

export const normaliseIdNumber = (raw: string) => raw.replace(/[\s-]/g, "").toUpperCase();

/** NIC days run 1 to 366 in a fixed calendar where February always has 29 days. Women's add 500. */
const NIC_MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function parseNic(raw: string): { year: number; month: number; day: number } | null {
  const id = normaliseIdNumber(raw);
  const old = /^(\d{2})(\d{3})\d{4}[VX]$/.exec(id);
  const current = /^(\d{4})(\d{3})\d{5}$/.exec(id);
  const match = old ?? current;
  if (!match) return null;
  const year = old ? 1900 + Number(match[1]) : Number(match[1]);
  let dayOfYear = Number(match[2]);
  if (dayOfYear > 500) dayOfYear -= 500;
  if (dayOfYear < 1 || dayOfYear > 366 || year < 1900) return null;
  let month = 0;
  let day = dayOfYear;
  while (day > NIC_MONTHS[month]!) {
    day -= NIC_MONTHS[month]!;
    month += 1;
  }
  return { year, month: month + 1, day };
}

const isAdult = ({ year, month, day }: { year: number; month: number; day: number }, today: Date) => {
  const adultYear = year + MIN_AGE;
  const nowYear = today.getUTCFullYear();
  const nowMonth = today.getUTCMonth() + 1;
  const nowDay = today.getUTCDate();
  return adultYear < nowYear || (adultYear === nowYear && (month < nowMonth || (month === nowMonth && day <= nowDay)));
};

const NAME_WORDS = /^[\p{L}\p{M}.' -]+$/u;
const words = (name: string) => name.toLocaleLowerCase().split(/[\s.'-]+/).filter(Boolean);

export type IdentityField = "legalName" | "docType" | "idNumber";
export type IdentityErrors = Partial<Record<IdentityField, string>>;

const Input = z.strictObject({
  legalName: z.string().trim().min(3).max(100),
  docType: z.enum(Object.keys(DOC_TYPES) as [DocType, ...DocType[]]),
  idNumber: z.string().trim().min(5).max(24),
});
export type IdentityInput = z.infer<typeof Input>;

/** The name on the account must be part of the name on the document. */
export function validateIdentity(input: unknown, firstName: string | null, today = new Date()): { ok: true; data: IdentityInput } | { ok: false; errors: IdentityErrors } {
  const parsed = Input.safeParse(input);
  const errors: IdentityErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as IdentityField;
      if (field === "legalName") errors.legalName = "Enter your full name, exactly as printed on your ID.";
      if (field === "docType") errors.docType = "Choose which ID you’re using.";
      if (field === "idNumber") errors.idNumber = "Enter the number printed on your ID.";
    }
    return { ok: false, errors: Object.keys(errors).length > 0 ? errors : { legalName: "Enter your full name, exactly as printed on your ID." } };
  }

  const { legalName, docType } = parsed.data;
  const idNumber = normaliseIdNumber(parsed.data.idNumber);

  if (!NAME_WORDS.test(legalName) || words(legalName).length < 2) {
    errors.legalName = "Enter your full name, exactly as printed on your ID.";
  } else if (firstName) {
    const account = cleanFirstName(firstName);
    if (!account || !words(account).every((w) => words(legalName).includes(w))) {
      errors.legalName = `This must include the name on your account, ${firstName}. If that’s wrong, start again with the name on your ID.`;
    }
  }

  if (docType === "nic") {
    const birth = parseNic(idNumber);
    if (!birth) errors.idNumber = "That isn’t a valid NIC number. Use 12 digits, or 9 digits and a V or X.";
    else if (!isAdult(birth, today)) errors.idNumber = `You must be ${MIN_AGE} or older to join Oddjob.`;
  } else if (docType === "licence" && !/^[A-Z]{0,2}\d{5,12}$/.test(idNumber)) {
    errors.idNumber = "That isn’t a valid licence number.";
  } else if (docType === "passport" && !/^[A-Z]{1,2}\d{6,8}$/.test(idNumber)) {
    errors.idNumber = "That isn’t a valid passport number.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { legalName: legalName.replace(/\s+/g, " "), docType, idNumber } };
}

export type ImageKind = "jpeg" | "png" | "webp";

/** Trusts the file's first bytes, never its name or its claimed type. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return null;
}

export const IMAGE_MESSAGES = {
  type: "Use a JPG, PNG or WebP photo.",
  size: "That photo is too large. The limit is 8 MB.",
  small: "That photo is too small to read. Take it closer, in good light.",
  missing: "Add this photo to continue.",
} as const;
