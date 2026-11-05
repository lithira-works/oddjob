import type { Metadata } from "next";
import { DealsDesk } from "@/components/admin/desks";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Deals" };

export default async function AdminDealsPage() {
  await requireAdmin();
  return <DealsDesk />;
}
