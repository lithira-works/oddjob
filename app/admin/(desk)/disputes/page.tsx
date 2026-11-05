import type { Metadata } from "next";
import { NotBuilt } from "@/components/admin/NotBuilt";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Disputes" };

export default async function AdminDisputesPage() {
  await requireAdmin();
  return (
    <NotBuilt
      title="Disputes"
      why="The guarantee and disputes are words on the site for now. No dispute can be opened, so none can arrive here."
      needs={[
        "A payment provider holding real money",
        "A written process, and named staff to run it",
        "A way for a household or worker to open a dispute",
        "A second approver for refunds",
      ]}
    />
  );
}
