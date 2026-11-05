import type { Metadata } from "next";
import { NotBuilt } from "@/components/admin/NotBuilt";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "ID checks" };

export default async function AdminChecksPage() {
  await requireAdmin();
  const open = process.env.ID_CHECKS_OPEN === "true";
  return (
    <NotBuilt
      title="ID checks"
      why="Nobody reviews IDs on this site yet. The only way to approve someone is review_identity() in the SQL Editor."
      state={open ? "ID checks are open." : "ID checks are closed."}
      needs={[
        "Everything on the list in docs/SECURITY.md, before ID_CHECKS_OPEN is set",
        "A reviewer screen, with its own role and a log of who looked at what",
        "A job that deletes ID photos at purge_after",
        "A second factor on this desk, because these are the most sensitive files on the site",
      ]}
    />
  );
}
