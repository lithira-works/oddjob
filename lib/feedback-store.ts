import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FEEDBACK_KINDS, type Feedback, type FeedbackKind } from "./feedback";

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

const SavedFeedback = z.object({
  at: z.iso.datetime(),
  kind: z.enum(Object.keys(FEEDBACK_KINDS) as [FeedbackKind, ...FeedbackKind[]]),
  message: z.string(),
});
export type SavedFeedback = z.infer<typeof SavedFeedback>;

/** Newest first. A damaged line is skipped, so one bad entry can't hide the rest. For admin pages only. */
export async function readFeedback(folder = path.join(process.cwd(), "user-data")): Promise<SavedFeedback[]> {
  const text = await readFile(path.join(folder, "feedback.jsonl"), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const entries: SavedFeedback[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = SavedFeedback.safeParse(JSON.parse(line));
      if (parsed.success) entries.push(parsed.data);
    } catch {
      // Not JSON: skip it.
    }
  }
  return entries.reverse();
}
