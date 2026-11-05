import type { Metadata } from "next";
import { Overview } from "@/components/admin/panels";
import { siteStatus } from "@/lib/admin-status";
import { requireAdmin } from "@/lib/admin-session";
import { readFeedback } from "@/lib/feedback-store";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  // Before any data is read. Every admin page starts with this.
  await requireAdmin();
  const [feedback, status] = await Promise.all([readFeedback(), siteStatus()]);
  return <Overview setup={status} feedback={feedback.map((note) => note.at)} />;
}
