import "server-only";
import { createHmac } from "node:crypto";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, MIN_IMAGE_SIDE, sniffImage, type DocType } from "./identity";

/**
 * Rebuilds a photo from its pixels. Hidden payloads and location data don't survive, because only
 * the picture is carried over. A file that isn't really an image fails here.
 */
export async function rebuildImage(input: Uint8Array) {
  if (input.byteLength > MAX_IMAGE_BYTES || !sniffImage(input)) return null;
  try {
    const image = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
    const { width = 0, height = 0 } = await image.metadata();
    if (Math.min(width, height) < MIN_IMAGE_SIDE) return null;
    return await image.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch {
    return null;
  }
}

/**
 * The same ID can't open two accounts. Only this keyed hash is stored, so a database leak doesn't
 * reveal ID numbers. The key lives outside the database.
 */
export function hashIdNumber(docType: DocType, idNumber: string, secret: string) {
  return createHmac("sha256", secret).update(`${docType}:${idNumber}`).digest("hex");
}
