import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { normaliseIdNumber, parseNic, sniffImage, validateIdentity } from "@/lib/identity";

vi.mock("server-only", () => ({}));
const { hashIdNumber, rebuildImage } = await import("@/lib/identity-store");

const today = new Date("2026-11-05T00:00:00Z");
const good = { legalName: "Nimal Perera", docType: "nic", idNumber: "199012345678" };

describe("parseNic", () => {
  it("reads the 12-digit form", () => {
    expect(parseNic("199012345678")).toEqual({ year: 1990, month: 5, day: 2 });
  });
  it("reads the old form, and women's days", () => {
    expect(parseNic("901234567V")).toEqual({ year: 1990, month: 5, day: 2 });
    expect(parseNic("906234567x")).toEqual({ year: 1990, month: 5, day: 2 });
    expect(parseNic("90 123 4567 V")).toEqual({ year: 1990, month: 5, day: 2 });
  });
  it("handles the first and last days of the year", () => {
    expect(parseNic("199000112345")).toEqual({ year: 1990, month: 1, day: 1 });
    expect(parseNic("199036612345")).toEqual({ year: 1990, month: 12, day: 31 });
  });
  it("refuses impossible numbers", () => {
    for (const bad of ["", "12345", "199000012345", "199036712345", "199050012345", "199086712345", "901234567A", "18901234567", "abcdefghijkl", "189012345678"]) {
      expect(parseNic(bad)).toBeNull();
    }
  });
});

describe("validateIdentity", () => {
  it("accepts matching details", () => {
    expect(validateIdentity(good, "Nimal", today).ok).toBe(true);
  });
  it("cleans the number", () => {
    const result = validateIdentity({ ...good, idNumber: "1990 1234 5678" }, "Nimal", today);
    expect(result.ok && result.data.idNumber).toBe("199012345678");
    expect(normaliseIdNumber("90-123 4567v")).toBe("901234567V");
  });
  it("refuses a name that doesn't include the account's", () => {
    const result = validateIdentity({ ...good, legalName: "Kamal Silva" }, "Nimal", today);
    expect(!result.ok && result.errors.legalName).toContain("Nimal");
  });
  it("doesn't accept a name hidden inside another word", () => {
    expect(validateIdentity({ ...good, legalName: "Nimalka Perera" }, "Nimal", today).ok).toBe(false);
  });
  it("matches regardless of case and initials", () => {
    expect(validateIdentity({ ...good, legalName: "A.B. NIMAL PERERA" }, "nimal", today).ok).toBe(true);
  });
  it("wants a full name with no numbers or symbols", () => {
    for (const legalName of ["Nimal", "Nimal 123", "<b>Nimal</b> Perera", "Nimal@ Perera"]) {
      expect(validateIdentity({ ...good, legalName }, "Nimal", today).ok).toBe(false);
    }
  });
  it("refuses under-18s, by their birth date", () => {
    const eighteenTomorrow = "200831100000"; // 6 Nov 2008, day 311
    const eighteenToday = "200831000000"; // 5 Nov 2008, day 310
    const result = validateIdentity({ ...good, idNumber: eighteenTomorrow }, "Nimal", today);
    expect(!result.ok && result.errors.idNumber).toContain("18");
    expect(validateIdentity({ ...good, idNumber: eighteenToday }, "Nimal", today).ok).toBe(true);
  });
  it("checks licence and passport shapes", () => {
    expect(validateIdentity({ ...good, docType: "licence", idNumber: "B1234567" }, "Nimal", today).ok).toBe(true);
    expect(validateIdentity({ ...good, docType: "licence", idNumber: "not-valid!" }, "Nimal", today).ok).toBe(false);
    expect(validateIdentity({ ...good, docType: "passport", idNumber: "N1234567" }, "Nimal", today).ok).toBe(true);
    expect(validateIdentity({ ...good, docType: "passport", idNumber: "12" }, "Nimal", today).ok).toBe(false);
  });
  it("refuses unknown types, extra fields and non-objects", () => {
    expect(validateIdentity({ ...good, docType: "library-card" }, "Nimal", today).ok).toBe(false);
    expect(validateIdentity({ ...good, status: "approved" }, "Nimal", today).ok).toBe(false);
    expect(validateIdentity(null, "Nimal", today).ok).toBe(false);
  });
});

describe("photo checks", () => {
  const photo = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#888" } });

  it("trusts bytes, not names", async () => {
    expect(sniffImage(await photo(10, 10).jpeg().toBuffer())).toBe("jpeg");
    expect(sniffImage(await photo(10, 10).png().toBuffer())).toBe("png");
    expect(sniffImage(await photo(10, 10).webp().toBuffer())).toBe("webp");
    expect(sniffImage(new TextEncoder().encode("<?php system($_GET['c']); ?>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });
  it("refuses a program with a fake image header", async () => {
    const fake = new Uint8Array([0xff, 0xd8, 0xff, ...new TextEncoder().encode("MZ this is not a picture")]);
    expect(await rebuildImage(fake)).toBeNull();
  });
  it("refuses tiny and oversized files", async () => {
    expect(await rebuildImage(await photo(100, 100).jpeg().toBuffer())).toBeNull();
    expect(await rebuildImage(new Uint8Array(8 * 1024 * 1024 + 1))).toBeNull();
  });
  it("removes location data and anything added after the picture", async () => {
    const withExif = await photo(800, 800).withExif({ IFD3: { GPSLatitude: "6/1 54/1 0/1" } }).jpeg().toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const smuggled = Buffer.concat([withExif, Buffer.from("<?php echo 'hidden payload'; ?>")]);
    const clean = await rebuildImage(smuggled);
    expect(clean).not.toBeNull();
    expect((await sharp(clean!).metadata()).exif).toBeUndefined();
    expect(clean!.includes("hidden payload")).toBe(false);
  });
});

describe("ID number hash", () => {
  it("is stable, keyed and hides the number", () => {
    const a = hashIdNumber("nic", "199012345678", "key-one");
    expect(a).toBe(hashIdNumber("nic", "199012345678", "key-one"));
    expect(a).not.toBe(hashIdNumber("nic", "199012345678", "key-two"));
    expect(a).not.toBe(hashIdNumber("nic", "199012345679", "key-one"));
    expect(a).not.toContain("199012345678");
  });
});

describe("identity schema", () => {
  const sql = readFileSync("supabase/migrations/0002_identity_checks.sql", "utf8");
  it("keeps files private and approval out of visitors' reach", () => {
    expect(sql).toContain("'id-documents', 'id-documents', false");
    expect(sql).toContain("revoke all on function review_identity(uuid, boolean, text) from public, anon, authenticated");
    expect(sql).not.toMatch(/grant [^;]*(insert|update)[^;]*identity_checks/i);
    expect(sql).not.toMatch(/create policy[^;]*storage\.objects/i);
  });
});
