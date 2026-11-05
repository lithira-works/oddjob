import { appendFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Feedback } from "./feedback";

/** Stops a flood of requests from filling the disk. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * One JSON line per entry, in a folder git and the privacy check both refuse. No IP address or
 * browser details are kept. Hosting without a lasting disk needs the database instead.
 */
export async function saveFeedback(entry: Feedback, folder = path.join(process.cwd(), "user-data"), now = new Date()) {
  await mkdir(folder, { recursive: true });
  const file = path.join(folder, "feedback.jsonl");
  const size = await stat(file).then((s) => s.size, () => 0);
  if (size >= MAX_FILE_BYTES) throw new Error("Feedback file is full");
  await appendFile(file, `${JSON.stringify({ at: now.toISOString(), ...entry })}\n`, { encoding: "utf8", mode: 0o600 });
}
