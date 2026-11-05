"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { answerJob, balanceOf, InsufficientCreditsError, refundFakeLead, topUp, type LedgerEntry } from "@/lib/credits";
import { boardJobs, JOB_WHEN, MAX_REPLIES, type BoardJob, type JobWhen } from "@/lib/data/jobs";
import { tradeBySlug } from "@/lib/data/trades";
import { capitalise, countByTrade, filterJobs, marketHref } from "@/lib/market";
import { AdSlot } from "./AdSlot";
import { CategoryPicker, followInPlace } from "./CategoryPicker";
import { ExploreDoors } from "./ExploreDoors";
import { TradeIcon } from "./TradeIcon";

const opening = (): LedgerEntry[] => topUp([], "welcome", 10);
/** Preview only: survives moving between pages, and is lost on reload. See docs/STATUS.md. */
let kept: LedgerEntry[] | null = null;

/** Which job in the list the ad space follows. */
const AD_AFTER = 3;

export function Board({ initialTrade, initialWhen }: { initialTrade?: string; initialWhen?: JobWhen }) {
  const [ledger, setLedgerState] = useState<LedgerEntry[]>(() => kept ?? opening());
  const [notice, setNotice] = useState<string | null>(null);
  const [trade, setTrade] = useState(initialTrade);
  const [when, setWhen] = useState(initialWhen);
  const [search, setSearch] = useState("");

  const setLedger = (next: LedgerEntry[]) => {
    kept = next;
    setLedgerState(next);
  };

  const balance = balanceOf(ledger);
  const paid = (id: string) => ledger.some((e) => e.key === `answer:${id}`);
  const refunded = (id: string) => ledger.some((e) => e.key === `refund:${id}`);

  const applyFilters = (nextTrade: string | undefined, nextWhen: JobWhen | undefined) => {
    setTrade(nextTrade);
    setWhen(nextWhen);
    window.history.replaceState(null, "", marketHref("/jobs", { trade: nextTrade, when: nextWhen }));
  };

  const counts = useMemo(() => countByTrade(filterJobs({ when, search })), [when, search]);
  const total = useMemo(() => filterJobs({ when, search }).length, [when, search]);
  const jobs = useMemo(() => filterJobs({ trade, when, search }), [trade, when, search]);
  const chosen = tradeBySlug(trade);

  const answer = (id: string, cost: number) => {
    try {
      setLedger(answerJob(ledger, id, cost));
      setNotice(null);
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        setNotice(`This job costs ${error.needed} credits and you have ${error.balance}. Add credits to answer it.`);
      } else {
        throw error;
      }
    }
  };

  const row = (job: BoardJob) => {
    const mine = paid(job.id) && !refunded(job.id);
    const full = job.replies >= MAX_REPLIES && !paid(job.id);
    return (
      <li key={job.id} className={`board__row ${mine ? "is-mine" : ""}`} data-ui="" data-reveal="row">
        <div className="board__what">
          <h2 className="display board__words">{job.words}</h2>
          <p className="board__note">{job.note}</p>
        </div>
        <span className="board__meta">
          <span className="tradetag"><TradeIcon slug={job.tradeSlug} size={18} /><span className="cap">{tradeBySlug(job.tradeSlug)?.name}</span></span>
          {job.area}, rough area only
          <br />
          {job.when}. {job.replies + (mine ? 1 : 0)} of {MAX_REPLIES} replies
        </span>
        {refunded(job.id) ? (
          <span className="small">Reported. Credits returned.</span>
        ) : mine ? (
          <span className="small" style={{ fontWeight: 500 }}>Answered</span>
        ) : (
          <button type="button" className="btn btn--white" disabled={full} onClick={() => answer(job.id, job.cost)}>
            {full ? "Full: five replied" : `Answer for ${job.cost} credits`}
          </button>
        )}
        {mine && (
          <div className="board__open">
            <span>Chat is open. You get the exact address and a masked line if you are booked.</span>
            <button type="button" className="link" onClick={() => { setLedger(refundFakeLead(ledger, job.id)); setNotice(null); }}>Report a fake lead</button>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <ExploreDoors side="jobs" trade={trade} />

      <div className="market">
        <aside className="market__side">
          <div className="board__credits" aria-live="polite">
            <b>{balance}</b>
            <span>credits left</span>
            <button type="button" className="btn btn--small btn--white" onClick={() => { setLedger(topUp(ledger, `demo-${ledger.length}`, 10)); setNotice(null); }}>
              Add 10 credits (preview)
            </button>
          </div>
          <CategoryPicker path="/jobs" current={trade} counts={counts} total={total} keep={{ when }} onPick={(next) => applyFilters(next, when)} />
        </aside>

        <div className="market__main">
          <p>
            Pay only for the jobs you answer, and see the cost first. Sample jobs: nobody posted these, and no money moves. Real jobs will show only to signed-in, ID-checked workers.
          </p>

          <p className="market__count small" aria-live="polite">
            {jobs.length} {jobs.length === 1 ? "sample job" : "sample jobs"}{chosen ? ` for ${chosen.article} ${chosen.name}` : ""}
          </p>

          <div className="market__tools">
            <label className="field market__search">
              <span>Search these jobs</span>
              <input type="search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Leak, gate, termites" maxLength={80} autoComplete="off" />
            </label>
            <div className="seg" role="group" aria-label="When">
              {[undefined, ...JOB_WHEN].map((option) => (
                <a
                  key={option ?? "any"}
                  className="seg__item"
                  href={marketHref("/jobs", { trade, when: option })}
                  aria-current={when === option ? "true" : undefined}
                  onClick={(e) => followInPlace(e, () => applyFilters(trade, option))}
                >
                  {option ?? "Any time"}
                </a>
              ))}
            </div>
          </div>

          {notice && <p className="alert" role="alert" style={{ color: "var(--ink)", marginBottom: 12, maxWidth: "none" }}>{notice}</p>}

          {jobs.length > 0 ? (
            <ul>
              {jobs.map((job, i) => (
                <Fragment key={job.id}>
                  {row(job)}
                  {i === AD_AFTER - 1 && <li className="market__ad"><AdSlot slot="jobs" /></li>}
                </Fragment>
              ))}
              {jobs.length < AD_AFTER && <li className="market__ad"><AdSlot slot="jobs" /></li>}
            </ul>
          ) : (
            <div className="market__empty">
              {chosen?.gated ? (
                <p>{capitalise(chosen.name)} jobs stay closed until our safety checks are in place.</p>
              ) : (
                <p>No homes match right now. Try another category, or clear your search.</p>
              )}
              <button type="button" className="btn btn--white btn--small" onClick={() => { setSearch(""); applyFilters(undefined, undefined); }}>
                Show all jobs
              </button>
            </div>
          )}

          <section className="board__ledger">
            <h2 className="display">Your credits</h2>
            <div>
              <p>Every credit in and out is listed. Nothing is charged twice, and your balance is worked out from this list.</p>
              <ul className="num">
                {[...ledger].reverse().map((e) => (
                  <li key={e.key}><span>{e.note}</span><span>{e.amount > 0 ? `+${e.amount}` : e.amount}</span></li>
                ))}
              </ul>
              <p style={{ marginTop: 32 }}>
                Need something fixed yourself? <Link href="/job" className="link">Post your own job</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
