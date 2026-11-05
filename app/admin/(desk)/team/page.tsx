import type { Metadata } from "next";
import { TeamDesk } from "@/components/admin/desks";
import { RoleGate, RoleTable } from "@/components/admin/panels";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage() {
  const admin = await requireAdmin();
  return (
    <RoleGate area="team">
      <TeamDesk email={admin.email} />
      <RoleTable />
    </RoleGate>
  );
}
