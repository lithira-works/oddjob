import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-session";
import { readFeedback } from "@/lib/feedback-store";

/** The left tabs. A layout doesn't re-run on every move between tabs, so each page checks again. */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const feedback = await readFeedback();
  return <AdminShell email={admin.email} feedbackKeys={feedback.map((note) => note.at)}>{children}</AdminShell>;
}
