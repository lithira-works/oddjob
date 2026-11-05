"use client";

import { Check, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { addCredits, draftCount, refundLead, toggleHandled } from "@/lib/admin/drafts";
import { AREAS, can, ROLE_NAMES, ROLES, type Action, type Area } from "@/lib/admin/roles";
import { balanceOf } from "@/lib/credits";
import { sampleLedger } from "@/lib/data/admin-ledgers";
import { AD_SLOTS } from "@/lib/data/ads";
import { FEEDBACK_KINDS, type FeedbackKind } from "@/lib/feedback";
import type { StatusRow } from "@/lib/admin-status";
import { allDeals, allJobs, allTrades, allWorkers, tradeLabel } from "./records";
import { change, discardAll, useDrafts } from "./store";

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" });

export type FeedbackNote = { at: string; kind: FeedbackKind; message: string };

/** Screen only: real role checks need real accounts. See docs/SECURITY.md. */
export function RoleGate({ area, children }: { area: Area; children: React.ReactNode }) {
  const { role } = useDrafts();
  if (can(role, area, "view")) return children;
  return (
    <section className="dk">
      <h1 className="display dk__title">Admins only</h1>
      <p className="dk__note">Managers can’t open {AREAS[area]}. Switch the preview back to Admin to see it.</p>
    </section>
  );
}

export function Overview({ setup, feedback }: { setup: StatusRow[]; feedback: string[] }) {
  const drafts = useDrafts();
  const jobs = allJobs(drafts);
  const workers = allWorkers(drafts);
  const trades = allTrades(drafts);
  const deals = allDeals(drafts);
  const unread = feedback.filter((key) => !drafts.handled.includes(key)).length;
  const todos = setup.filter((row) => row.todo).length;
  const cold = jobs.filter((job) => job.status === "Open" && job.replies === 0).length;
  const pending = draftCount(drafts);
  const newest = jobs[0];
  const showSetup = can(drafts.role, "setup", "view");

  const queue = [
    { show: unread > 0, count: unread, text: unread === 1 ? "feedback note to read" : "feedback notes to read", href: "/admin/feedback" },
    { show: todos > 0 && showSetup, count: todos, text: todos === 1 ? "setup item to finish" : "setup items to finish", href: "/admin/setup" },
    { show: pending > 0, count: pending, text: pending === 1 ? "draft change to review" : "draft changes to review", href: "/admin/activity" },
    { show: cold > 0, count: cold, text: cold === 1 ? "open job with no replies (sample)" : "open jobs with no replies (sample)", href: "/admin/jobs" },
  ].filter((row) => row.show);
  const total = queue.length;

  return (
    <section className="dk ov">
      <h1 className="display ov__title">{total === 0 ? "Nothing needs you" : `${total} ${total === 1 ? "thing needs" : "things need"} you`}</h1>
      <div className="ov__grid">
        <div className="ov__queue">
          {queue.length === 0 ? (
            <p>The queue is clear.</p>
          ) : (
            <ul>
              {queue.map((row) => (
                <li key={row.href}>
                  <Link href={row.href} prefetch={false} className="ov__row">
                    <span className="ov__rowtext"><b className="display num">{row.count}</b> {row.text}</span>
                    <span className="traderow__arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {newest && (
          <Link href={`/admin/jobs?edit=${encodeURIComponent(newest.id)}`} prefetch={false} className="ticket ov__ticket">
            <span className="ticket__top"><span>Newest job (sample)</span><span>{newest.when}</span></span>
            <span className="display ticket__words ov__ticketwords">{newest.words}</span>
            <span className="small">{newest.area}</span>
          </Link>
        )}
      </div>

      <div className="ov__figures">
        <p className="small ov__figurenote">Sample data. These figures aren’t real activity.</p>
        <dl>
          <div><dt><Link href="/admin/jobs" prefetch={false} className="link--quiet link">Open jobs</Link></dt><dd className="display num">{jobs.filter((j) => j.status === "Open").length}</dd></div>
          <div><dt><Link href="/admin/workers" prefetch={false} className="link--quiet link">People listed</Link></dt><dd className="display num">{workers.filter((w) => w.status === "Listed").length}</dd></div>
          <div><dt><Link href="/admin/trades" prefetch={false} className="link--quiet link">Trades open</Link></dt><dd className="display num">{trades.filter((t) => !t.gated).length}</dd></div>
          <div><dt><Link href="/admin/deals" prefetch={false} className="link--quiet link">Deals live</Link></dt><dd className="display num">{deals.filter((d) => d.status === "Live").length}</dd></div>
          <div><dt><Link href="/admin/ads" prefetch={false} className="link--quiet link">Ad spaces</Link></dt><dd className="display num">{Object.keys(AD_SLOTS).length}</dd></div>
        </dl>
      </div>
    </section>
  );
}

export function FeedbackDesk({ notes }: { notes: FeedbackNote[] }) {
  const drafts = useDrafts();
  const [state, setState] = useState<"Waiting" | "Handled" | "All">("Waiting");
  const [kind, setKind] = useState<FeedbackKind | "All">("All");
  const [query, setQuery] = useState("");
  const mayEdit = can(drafts.role, "feedback", "edit");
  const asked = query.trim().toLowerCase();
  const isHandled = (note: FeedbackNote) => drafts.handled.includes(note.at);
  const shown = notes.filter((note) =>
    (state === "All" || (state === "Handled") === isHandled(note)) &&
    (kind === "All" || note.kind === kind) &&
    (!asked || note.message.toLowerCase().includes(asked)));
  const waiting = notes.filter((note) => !isHandled(note)).length;

  return (
    <section className="dk">
      <header className="dk__head">
        <div className="dk__headtext">
          <h1 className="display dk__title">Feedback</h1>
          <p className="dk__note">Real notes from the feedback page. Read-only here. Handled marks stay in this browser.</p>
        </div>
      </header>
      {notes.length > 0 && <div className="dk__tools">
        <span className="dk__searchbox">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input className="input dk__search" type="search" value={query} placeholder="Search feedback" aria-label="Search feedback" onChange={(e) => setQuery(e.target.value)} />
        </span>
        <div className="seg" role="group" aria-label="Filter by state">
          {(["Waiting", "Handled", "All"] as const).map((option) => (
            <button key={option} type="button" className="seg__item" aria-current={state === option ? "true" : undefined} onClick={() => setState(option)}>
              {option}{option === "Waiting" && <span className="num">&nbsp;{waiting}</span>}
            </button>
          ))}
        </div>
        <select className="input dk__select" value={kind} aria-label="Filter by kind" onChange={(e) => setKind(e.target.value as FeedbackKind | "All")}>
          <option value="All">Every kind</option>
          {(Object.keys(FEEDBACK_KINDS) as FeedbackKind[]).map((option) => <option key={option} value={option}>{FEEDBACK_KINDS[option]}</option>)}
        </select>
      </div>}
      {shown.length === 0 ? (
        <div className="market__empty dk__empty">
          {notes.length === 0 ? (
            <>
              <p className="dk__emptyhead">No feedback yet</p>
              <p>Notes people send from the feedback page land here.</p>
              <Link href="/feedback" prefetch={false} className="link">Open the feedback page</Link>
            </>
          ) : (
            <p className="dk__emptyhead">No notes match. Try another filter.</p>
          )}
        </div>
      ) : (
        <ul className="dk__notes">
          {shown.map((note) => (
            <li key={note.at} className={isHandled(note) ? "dk__notedone" : undefined}>
              <div>
                <p className="admin__meta"><b>{FEEDBACK_KINDS[note.kind]}</b> <time dateTime={note.at}>{when.format(new Date(note.at))}</time></p>
                <p className="admin__note">{note.message}</p>
              </div>
              {mayEdit && (
                <button type="button" className="btn btn--small btn--ghost" onClick={() => change((s) => toggleHandled(s, note.at))}>
                  {isHandled(note) ? "Reopen" : <><Check size={16} aria-hidden="true" />&nbsp;Handled</>}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CreditsDesk() {
  const drafts = useDrafts();
  const workers = allWorkers(drafts);
  const [picked, setPicked] = useState(workers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  // One key per intended top-up, so a double click or a retry can't add credits twice.
  const key = useRef("");
  if (!key.current) key.current = crypto.randomUUID();

  const worker = workers.find((w) => w.id === picked) ?? workers[0];
  const mayMove = can(drafts.role, "credits", "create");
  const baseOf = (id: string, trade: string) => sampleLedger(id, trade);
  const ledgerOf = (id: string, trade: string) => drafts.ledgers[id] ?? baseOf(id, trade);

  if (!worker) return <section className="dk"><h1 className="display dk__title">Credits</h1><p className="dk__note">Nobody listed yet.</p></section>;
  const ledger = ledgerOf(worker.id, worker.tradeSlug);
  const base = baseOf(worker.id, worker.tradeSlug);

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      setError("Use a whole number from 1 to 1000.");
      return;
    }
    setError(null);
    change((s) => addCredits(s, worker.id, base, `admin:${key.current}`, value, new Date().toISOString()), `${value} draft credits added.`);
    key.current = crypto.randomUUID();
    setAmount("");
  };

  return (
    <section className="dk">
      <header className="dk__head">
        <div className="dk__headtext">
          <h1 className="display dk__title">Credits</h1>
          <p className="dk__note">Sample ledgers. No money moves. A balance is worked out from its entries, and an entry can’t be edited or deleted: a mistake gets a new entry.</p>
        </div>
      </header>
      <label className="field dk__pickphone">
        <span>Worker</span>
        <select className="input" value={worker.id} onChange={(e) => setPicked(e.target.value)}>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </label>
      <div className="cr">
        <ul className="cr__people">
          {workers.map((w) => (
            <li key={w.id}>
              <button type="button" className="picker__item cr__person" aria-current={w.id === worker.id ? "true" : undefined} onClick={() => setPicked(w.id)}>
                <span>{w.name}</span>
                <span className="num">{balanceOf(ledgerOf(w.id, w.tradeSlug))}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="cr__main">
          <div className="cr__balance">
            <p><b className="display num">{balanceOf(ledger)}</b> credits left</p>
            <p className="small">{worker.name}, {tradeLabel(allTrades(drafts).find((t) => t.slug === worker.tradeSlug) ?? { name: worker.tradeSlug })}</p>
          </div>
          {mayMove ? (
            <form className="cr__add" onSubmit={add} noValidate>
              <label className="field">
                <span>Add credits</span>
                <input className="input" inputMode="numeric" value={amount} aria-invalid={error ? true : undefined} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <button type="submit" className="btn">Add credits</button>
              {error && <p className="field__error" role="alert">{error}</p>}
            </form>
          ) : (
            <p className="small">{ROLE_NAMES[drafts.role]}s can see credits but can’t move them.</p>
          )}
          <table className="dk__table cr__table">
            <thead><tr><th scope="col">Entry</th><th scope="col" className="is-end">Credits</th><th scope="col" className="dk__rowact"><span className="dk__hidden">Actions</span></th></tr></thead>
            <tbody>
              {[...ledger].reverse().map((entry) => {
                const refunded = entry.jobId ? ledger.some((e) => e.key === `refund:${entry.jobId}`) : false;
                return (
                  <tr key={entry.key}>
                    <td className="dk__first">{entry.note}{entry.jobId && <span className="small dk__lock">{entry.jobId}</span>}</td>
                    <td className="is-end num">{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</td>
                    <td className="dk__rowact">
                      {mayMove && entry.kind === "answer-job" && (
                        <button
                          type="button"
                          className="btn btn--small btn--ghost"
                          disabled={refunded}
                          onClick={() => change((s) => refundLead(s, worker.id, base, entry.jobId!, new Date().toISOString()), "Draft refund added.")}
                        >
                          {refunded ? "Refunded" : "Refund fake lead"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const ACTIONS: Action[] = ["view", "create", "edit", "delete"];

export function RoleTable() {
  return (
    <div className="dk__panel">
      <h2 className="dk__panelhead">What each role can do</h2>
      <div className="dk__tablewrap">
        <table className="dk__spaces rt">
          <thead>
            <tr>
              <th scope="col">Tab</th>
              {ROLES.map((role) => <th key={role} scope="col">{ROLE_NAMES[role]}</th>)}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(AREAS) as Area[]).map((area) => (
              <tr key={area}>
                <th scope="row">{AREAS[area]}</th>
                {ROLES.map((role) => {
                  const allowed = ACTIONS.filter((action) => can(role, area, action));
                  return <td key={role}>{allowed.length === 0 ? "No access" : allowed.length === 4 ? "Everything" : allowed.map((a, i) => (i === 0 ? a.charAt(0).toUpperCase() + a.slice(1) : a)).join(", ")}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActivityDesk() {
  const drafts = useDrafts();
  const pending = draftCount(drafts);
  return (
    <section className="dk">
      <header className="dk__head">
        <div className="dk__headtext">
          <h1 className="display dk__title">Activity</h1>
          <p className="dk__note">What’s been drafted in this browser, by record id. This isn’t an audit log: it can be cleared, and nobody else can see it.</p>
        </div>
        {pending > 0 && <button type="button" className="btn btn--ink" onClick={discardAll}>Discard all drafts</button>}
      </header>
      {drafts.log.length === 0 ? (
        <div className="market__empty dk__empty"><p className="dk__emptyhead">Nothing yet</p><p>Edits you draft on any tab are listed here.</p></div>
      ) : (
        <div className="dk__tablewrap">
          <table className="dk__table">
            <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What</th><th scope="col">Where</th><th scope="col">Record</th></tr></thead>
            <tbody>
              {drafts.log.map((entry, i) => (
                <tr key={`${entry.at}-${i}`}>
                  <td className="dk__first num"><time dateTime={entry.at}>{when.format(new Date(entry.at))}</time></td>
                  <td data-label="Who">{ROLE_NAMES[entry.who]}</td>
                  <td data-label="What">{entry.did}</td>
                  <td data-label="Where">{entry.area.charAt(0).toUpperCase() + entry.area.slice(1)}</td>
                  <td data-label="Record">{entry.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
