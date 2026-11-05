import type { Metadata } from "next";
import { WorkersDesk } from "@/components/admin/desks";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Workers" };

export default async function AdminWorkersPage() {
  await requireAdmin();
  return <WorkersDesk />;
}
