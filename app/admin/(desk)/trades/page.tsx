import type { Metadata } from "next";
import { TradesDesk } from "@/components/admin/desks";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Trades" };

export default async function AdminTradesPage() {
  await requireAdmin();
  return <TradesDesk />;
}
