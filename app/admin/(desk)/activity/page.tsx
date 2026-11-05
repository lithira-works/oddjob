import type { Metadata } from "next";
import { ActivityDesk } from "@/components/admin/panels";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Activity" };

export default async function AdminActivityPage() {
  await requireAdmin();
  return <ActivityDesk />;
}
