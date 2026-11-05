"use client";

import { useState } from "react";
import { answerJob, balanceOf, InsufficientCreditsError, refundFakeLead, topUp, type LedgerEntry } from "@/lib/credits";
import { boardJobs, MAX_REPLIES } from "@/lib/data/jobs";
import { tradeBySlug } from "@/lib/data/trades";

const opening = (): LedgerEntry[] => topUp([], "welcome", 10);

export function Board() {
  const [ledger, setLedger] = useState<LedgerEntry[]>(opening);
  const [notice, setNotice] = useState<string | null>(null);
  const balance = balanceOf(ledger);
  const paid = (id: string) => ledger.some((e) => e.key === `answer:${id}`);
  const refunded = (id: string) => ledger.some((e) => e.key === `refund:${id}`);

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

  return (
    <>
      <div className="board__head">
        <h1 className="display">Jobs near you</h1>
        <div className="board__credits" aria-live="polite">
          <b>{balance}</b>
          <span>credits left</span>
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn btn--small btn--white" onClick={() => { setLedger(topUp(ledger, `demo-${ledger.length}`, 10)); setNotice(null); }}>
              Add 10 credits (preview)
            </button>
          </div>
        </div>
      </div>

      <p style={{ marginBottom: 20 }}>
        Answer the jobs you want. The cost is shown first, and a fake lead gets its credits back. Preview: these jobs are samples and no money moves.
      </p>
      {notice && <p className="alert" role="alert" style={{ color: "var(--ink)", marginBottom: 12, maxWidth: "none" }}>{notice}</p>}

      <ul>
        {boardJobs.map((job) => {
          const mine = paid(job.id) && !refunded(job.id);
          const full = job.replies >= MAX_REPLIES && !paid(job.id);
          return (
            <li key={job.id} className={`board__row ${mine ? "is-mine" : ""}`} data-ui="" data-reveal="row">
              <span className="display board__words">{job.words}</span>
              <span className="board__meta">
                <span className="cap">{tradeBySlug(job.tradeSlug)?.name}</span>. {job.area}. {job.when}.
                <br />
                {job.replies + (mine ? 1 : 0)} of {MAX_REPLIES} replies
              </span>
              {refunded(job.id) ? (
                <span className="small">Reported. Credits returned.</span>
              ) : mine ? (
                <span className="small" style={{ fontWeight: 500 }}>Answered</span>
              ) : (
                <button type="button" className="btn btn--white" disabled={full} onClick={() => answer(job.id, job.cost)}>
                  {full ? "Full" : `Answer for ${job.cost} credits`}
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
        })}
      </ul>

      <section className="board__ledger">
        <h2 className="display">Your credits</h2>
        <div>
          <p>Every credit in and out is listed. Nothing is charged twice, and your balance is worked out from this list.</p>
          <ul className="num">
            {[...ledger].reverse().map((e) => (
              <li key={e.key}><span>{e.note}</span><span>{e.amount > 0 ? `+${e.amount}` : e.amount}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
