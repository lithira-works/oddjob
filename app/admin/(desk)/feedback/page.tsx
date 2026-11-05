import type { Metadata } from "next";
import { FeedbackDesk } from "@/components/admin/panels";
import { requireAdmin } from "@/lib/admin-session";
import { readFeedback } from "@/lib/feedback-store";

export const metadata: Metadata = { title: "Feedback" };

const SHOWN = 200;

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const notes = await readFeedback();
  return <FeedbackDesk notes={notes.slice(0, SHOWN)} />;
}
