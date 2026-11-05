import type { Metadata } from "next";
import { NotBuilt } from "@/components/admin/NotBuilt";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Accounts" };

export default async function AdminAccountsPage() {
  await requireAdmin();
  return (
    <NotBuilt
      title="Accounts"
      why="Households and workers can’t have real accounts yet, so there’s nobody to manage. Sign-up runs on preview rules and stores nothing."
      needs={[
        "Real sign-in, through Supabase and an SMS provider",
        "The database tables applied, with Row Level Security tested",
        "A second factor and one login per person on this desk",
        "An audit log of every admin action, before this tab can show anyone’s details",
      ]}
    />
  );
}
