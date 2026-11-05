import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogout } from "@/components/AdminForms";
import { siteStatus } from "@/lib/admin-status";
import { requireAdmin } from "@/lib/admin-session";
import { FEEDBACK_KINDS, type FeedbackKind } from "@/lib/feedback";
import { readFeedback } from "@/lib/feedback-store";

export const metadata: Metadata = { title: "Admin" };

const SHOWN = 200;
const KINDS = Object.keys(FEEDBACK_KINDS) as FeedbackKind[];
const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" });

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ kind?: string | string[] }> }) {
  // Before any data is read. Every admin page starts with this.
  const admin = await requireAdmin();

  const asked = (await searchParams).kind;
  const kind = KINDS.find((k) => k === asked);
  const [feedback, status] = await Promise.all([readFeedback(), siteStatus()]);
  const shown = (kind ? feedback.filter((note) => note.kind === kind) : feedback);
  const filters = [
    { href: "/admin", label: "All", count: feedback.length, current: !kind },
    ...KINDS.map((k) => ({
      href: `/admin?kind=${k}`,
      label: FEEDBACK_KINDS[k],
      count: feedback.filter((note) => note.kind === k).length,
      current: kind === k,
    })),
  ];

  return (
    <>
      <header className="admin__bar">
        <Link href="/" className="display nav__mark">Oddjob</Link>
        <div className="admin__who">
          <span className="small admin__email">{admin.email}</span>
          <AdminLogout />
        </div>
      </header>
      <main className="admin">
        <h1 className="display admin__title">Admin</h1>
        <div className="admin__grid">
          <section aria-labelledby="admin-feedback">
            <h2 className="admin__head" id="admin-feedback">Feedback</h2>
            <nav className="admin__filters" aria-label="Filter feedback">
              {filters.map((f) => (
                <Link key={f.href} href={f.href} prefetch={false} aria-current={f.current ? "page" : undefined}>
                  {f.label} <span className="num">{f.count}</span>
                </Link>
              ))}
            </nav>
            {shown.length === 0 ? (
              <p>{feedback.length === 0 ? "No feedback yet. Notes sent from the feedback page appear here." : "No notes of this kind yet."}</p>
            ) : (
              <ul className="admin__notes">
                {shown.slice(0, SHOWN).map((note, i) => (
                  <li key={`${note.at}-${i}`}>
                    <p className="admin__meta"><b>{FEEDBACK_KINDS[note.kind]}</b> <time dateTime={note.at}>{when.format(new Date(note.at))}</time></p>
                    <p className="admin__note">{note.message}</p>
                  </li>
                ))}
              </ul>
            )}
            {shown.length > SHOWN && <p className="small">Showing the newest {SHOWN} of {shown.length}.</p>}
          </section>

          <section className="admin__status" aria-labelledby="admin-status">
            <h2 className="admin__head" id="admin-status">Site setup</h2>
            <table className="admin__table">
              <tbody>
                {status.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={row.todo ? "is-todo" : undefined}>{row.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small admin__limits">Accounts, jobs, payments and ID reviews aren’t built yet, so they can’t be managed here. Key values are never shown.</p>
          </section>
        </div>
      </main>
    </>
  );
}
