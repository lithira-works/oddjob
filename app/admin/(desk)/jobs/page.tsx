import type { Metadata } from "next";
import { JobsDesk } from "@/components/admin/desks";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Jobs" };

export default async function AdminJobsPage() {
  await requireAdmin();
  return <JobsDesk />;
}
