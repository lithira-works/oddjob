import type { Metadata } from "next";
import { AdsDesk } from "@/components/admin/desks";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Banner ads" };

export default async function AdminAdsPage() {
  await requireAdmin();
  return <AdsDesk />;
}
