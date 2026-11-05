import type { Metadata } from "next";
import { RoleGate } from "@/components/admin/panels";
import { siteStatus } from "@/lib/admin-status";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Setup" };

const GATES = [
  "A second factor at login: a passkey or hardware key",
  "One login per person, with managers as real accounts",
  "Roles checked by the server on every request",
  "An audit log nobody can edit",
  "A database behind these tabs",
  "A second approver for refunds and exports",
];

export default async function AdminSetupPage() {
  await requireAdmin();
  const status = await siteStatus();
  return (
    <RoleGate area="setup">
      <section className="dk">
        <header className="dk__head">
          <div className="dk__headtext">
            <h1 className="display dk__title">Setup</h1>
            <p className="dk__note">Whether each part of the site is set up. Key values are never shown.</p>
          </div>
        </header>
        <div className="su">
          <div className="dk__panel su__panel">
            <h2 className="dk__panelhead">Site</h2>
            <table className="dk__spaces">
              <tbody>
                {status.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={row.todo ? "is-todo" : undefined}>{row.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ticket su__gates">
            <h2 className="display dk__formtitle">Before edits go live</h2>
            <p>Every tab saves drafts for now. All of these must exist before this desk can change the real site.</p>
            <ul>
              {GATES.map((gate) => <li key={gate}>{gate}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </RoleGate>
  );
}
