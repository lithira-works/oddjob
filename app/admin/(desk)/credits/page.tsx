import type { Metadata } from "next";
import { CreditsDesk } from "@/components/admin/panels";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Credits" };

export default async function AdminCreditsPage() {
  await requireAdmin();
  return <CreditsDesk />;
}
