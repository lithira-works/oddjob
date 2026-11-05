"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { SCREEN_NOTICE, screenMessage, type ScreenResult } from "@/lib/contact-screen";
import { repliesFor, type Provider } from "@/lib/data/providers";
import { tradeBySlug, tradesByLetter } from "@/lib/data/trades";
import { matchTrade } from "@/lib/match";
import { money, protectionFee } from "@/lib/money";
import { validateJob, type JobErrors } from "@/lib/validation";

type Stage = "draft" | "quoted" | "booked" | "done" | "guaranteed";
const TRACK: { id: Stage; label: string }[] = [
  { id: "draft", label: "Sent" },
  { id: "quoted", label: "Quoted" },
  { id: "booked", label: "Booked" },
  { id: "done", label: "Done" },
  { id: "guaranteed", label: "Guaranteed" },
];

type ChatLine = { from: "me" | "them" | "note"; text: string };

async function screenOnServer(text: string): Promise<ScreenResult> {
  try {
    const res = await fetch("/api/messages/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) return (await res.json()) as ScreenResult;
  } catch {
    // Fall through: the local check still blocks details when the network fails.
  }
  return screenMessage(text);
}

const EMERGENCY_TEXT = {
  gas: "Gas smell? Turn off the cylinder if it is safe, keep switches off and leave the house. Call for help first, then post the job.",
  fire: "If there is fire or smoke, get out and call your emergency number now.",
  "electric-shock": "If someone had a shock, call your emergency number now. Do not touch live wires.",
} as const;

export function JobFlow({ initialWords, initialTrade }: { initialWords: string; initialTrade?: string }) {
  const [words, setWords] = useState(initialWords);
  const [override, setOverride] = useState(initialTrade ?? "");
  const [area, setArea] = useState("");
  const [when, setWhen] = useState("This week");
  const [stage, setStage] = useState<Stage>("draft");
  const [pickedSlug, setPickedSlug] = useState<string | null>(null);
  const [protect, setProtect] = useState(true);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState(false);
  const [errors, setErrors] = useState<JobErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const match = useMemo(() => matchTrade(words), [words]);
  const trade = tradeBySlug(override) ?? match.trade ?? undefined;
  const replies = useMemo(() => repliesFor(trade?.slug), [trade?.slug]);
  const picked: Provider | undefined = replies.find((p) => p.slug === pickedSlug);
  const stageIndex = TRACK.findIndex((t) => t.id === stage);
  const blocked = Boolean(trade?.gated);

  const go = (next: Stage) => {
    setStage(next);
    requestAnimationFrame(() => stageRef.current?.scrollIntoView({ block: "nearest" }));
  };

  /** Quick check here, then the server's check, which is the one that counts. */
  const submitJob = async (event: React.FormEvent) => {
    event.preventDefault();
    if (blocked || checking) return;
    const fields = { words, area, when, trade: override || match.trade?.slug || "" };
    const local = validateJob(fields);
    if (!local.ok) {
      setErrors(local.errors);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
    setChecking(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (response.ok) {
        go("quoted");
      } else if (response.status === 422) {
        const body = (await response.json()) as { errors?: JobErrors };
        setErrors(body.errors ?? {});
      } else if (response.status === 429) {
        setFormError("That’s a lot of requests at once. Please wait a minute and try again.");
      } else {
        setFormError("We couldn’t check your job. Please try again.");
      }
    } catch {
      setFormError("We couldn’t reach Oddjob. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  const pick = (slug: string) => {
    const p = replies.find((r) => r.slug === slug);
    setPickedSlug(slug);
    setChat([{ from: "them", text: `Hello, I can look at this. ${p ? `I could come ${p.arrives.toLowerCase()}.` : ""} Can you send a photo?` }]);
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    const result = await screenOnServer(text);
    setChat((lines) => [
      ...lines,
      { from: "me", text: result.redacted },
      ...(result.flagged ? [{ from: "note" as const, text: SCREEN_NOTICE }] : []),
    ]);
    setMessage("");
    setSending(false);
  };

  const total = picked ? picked.quote + (protect ? protectionFee(picked.quote) : 0) : 0;
  const shownWords = words.trim() || "What’s wrong at home?";

  return (
    <div className="jobgrid">
      <aside className="ticket on-dark" data-ui="" aria-label="Your job card">
        <div className="ticket__top">
          <span>Job card</span>
          <span className="cap">{trade ? trade.name : "Trade to be worked out"}</span>
        </div>
        <p className="display ticket__words">{shownWords}</p>
        <dl className="ticket__rows">
          <div className="ticket__row"><dt>Rough area</dt><dd>{area.trim() || "Not added yet"}</dd></div>
          <div className="ticket__row"><dt>When</dt><dd>{when}</dd></div>
          <div className="ticket__row"><dt>Exact address</dt><dd>{stageIndex >= 2 ? `Shared with ${picked?.name}` : "Hidden until you book"}</dd></div>
          {picked && <div className="ticket__row"><dt>Person</dt><dd>{picked.name}</dd></div>}
        </dl>
        <div className="track" role="status" aria-label={`Job status: ${TRACK[stageIndex]!.label}`}>
          {TRACK.map((t, i) => (
            <span key={t.id} className={i === stageIndex ? "is-now" : i < stageIndex ? "is-past" : ""}>{t.label}</span>
          ))}
        </div>
      </aside>

      <div className="stage" ref={stageRef}>
        {stage === "draft" && (
          <>
            <h1 className="display">Say what’s wrong</h1>
            {match.emergency && <p className="alert" role="alert" style={{ marginBottom: 20, maxWidth: "none" }}>{EMERGENCY_TEXT[match.emergency]}</p>}
            <form onSubmit={submitJob} noValidate>
              <label className="field">
                <span>In your own words</span>
                <textarea
                  className="input"
                  required
                  maxLength={500}
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  placeholder="Water under the kitchen sink"
                  aria-invalid={Boolean(errors.words)}
                  aria-describedby={errors.words ? "job-words-error" : undefined}
                />
                {errors.words && <small className="field__error" id="job-words-error" role="alert">{errors.words}</small>}
              </label>
              <label className="field">
                <span>Who should see this?</span>
                <select className="input" value={override || match.trade?.slug || ""} onChange={(e) => setOverride(e.target.value)}>
                  <option value="">Let Oddjob work it out</option>
                  {tradesByLetter().map((t) => (
                    <option key={t.slug} value={t.slug} disabled={t.gated}>
                      {t.name}{t.gated ? " (opens later)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Rough area</span>
                <input
                  className="input"
                  value={area}
                  maxLength={60}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Neighbourhood, not your address"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.area)}
                  aria-describedby={errors.area ? "job-area-error" : undefined}
                />
                {errors.area && <small className="field__error" id="job-area-error" role="alert">{errors.area}</small>}
              </label>
              <fieldset className="field">
                <legend>When?</legend>
                <div className="choice" style={{ marginTop: 6 }}>
                  {["Today", "This week", "Flexible"].map((w) => (
                    <label key={w}>
                      <input type="radio" name="when" value={w} checked={when === w} onChange={() => setWhen(w)} />
                      <span>{w}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {blocked ? (
                <p className="alert" style={{ maxWidth: "none" }}>Care work opens after identity, reference and police checks are in place. We can’t send this job yet.</p>
              ) : (
                <>
                  {formError && <p className="alert" role="alert" style={{ marginBottom: 20, maxWidth: "none" }}>{formError}</p>}
                  <button className="btn" type="submit" disabled={!words.trim() || checking}>{checking ? "Checking" : "Send to up to 5 people"}</button>
                </>
              )}
            </form>
          </>
        )}

        {stage === "quoted" && (
          <>
            <h2 className="display">{replies.length} people replied</h2>
            <p className="sample-note" style={{ marginBottom: 20 }}>Preview: these replies are made-up samples. Nothing was sent to anyone.</p>
            <div className="replies">
              {replies.map((p) => (
                <article key={p.slug} className={`reply ${pickedSlug === p.slug ? "is-picked" : ""}`}>
                  <div>
                    <div className="reply__name">{p.name}, {tradeBySlug(p.tradeSlug)?.name}</div>
                    <div className="reply__stats num">{p.booked} jobs booked · {p.redone} redone · {p.rehired} homes called back</div>
                    <div className="reply__stats">{p.area}. {p.arrives}.</div>
                  </div>
                  <div className="reply__quote">{money(p.quote)}</div>
                  <div className="reply__act">
                    <button type="button" className={`btn btn--small ${pickedSlug === p.slug ? "btn--white" : "btn--ink"}`} onClick={() => pick(p.slug)}>
                      {pickedSlug === p.slug ? "Talking now" : "Message"}
                    </button>
                    <Link href={`/pros/${p.slug}`} className="link small" target="_blank" rel="noopener">Read the ledger</Link>
                  </div>
                </article>
              ))}
            </div>

            {picked && (
              <div className="chat">
                <div className="chat__log" aria-live="polite">
                  {chat.map((line, i) => (
                    <div key={i} className={`bubble ${line.from === "me" ? "bubble--me" : line.from === "note" ? "bubble--note" : ""}`}>{line.text}</div>
                  ))}
                </div>
                <form className="chat__send" onSubmit={send}>
                  <label className="sr-only" htmlFor="chat-message">Message {picked.name}</label>
                  <input id="chat-message" className="input" value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder="Try typing a phone number" autoComplete="off" />
                  <button className="btn btn--ink" type="submit" disabled={sending}>Send</button>
                </form>
                <div className="receipt" style={{ background: "#fff", marginTop: 16, marginBottom: 0 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={protect} onChange={(e) => setProtect(e.target.checked)} />
                    <span>
                      <b style={{ fontWeight: 500 }}>Protect this job for {money(protectionFee(picked.quote))}</b>
                      <br />
                      <span className="small soft">Your money waits until you sign off, and you get a guarantee and receipt.</span>
                    </span>
                  </label>
                  <button type="button" className="btn" style={{ marginTop: 16 }} onClick={() => go("booked")}>
                    Book {picked.name} for {money(total)}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {stage === "booked" && picked && (
          <>
            <h2 className="display">{picked.name} is booked</h2>
            <div className="receipt">
              <dl>
                <div><dt>Arrives</dt><dd>{picked.arrives}</dd></div>
                <div><dt>Masked line</dt><dd className="num">Opens here once phone numbers are connected</dd></div>
                <div><dt>Exact address</dt><dd>Released to {picked.name} only</dd></div>
                <div><dt>{protect ? "Held until you sign off" : "Pay on the day"}</dt><dd className="num">{money(total)}</dd></div>
              </dl>
            </div>
            <button type="button" className="btn" onClick={() => go("done")}>The work is finished</button>
          </>
        )}

        {stage === "done" && picked && (
          <>
            <h2 className="display">Did it get fixed?</h2>
            <p style={{ marginBottom: 20 }}>
              {protect
                ? `Signing off releases ${money(picked.quote)} to ${picked.name}. Keep the money held if something is wrong.`
                : "This job wasn’t protected, so payment is between you. Your answer still goes on the work ledger."}
            </p>
            {problem ? (
              <p className="alert" role="status" style={{ maxWidth: "none" }}>
                The money stays held. We will review the photos and messages from this job, then decide. Preview: no case was opened.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button type="button" className="btn" onClick={() => go("guaranteed")}>Yes, sign it off</button>
                <button type="button" className="btn btn--ghost" onClick={() => setProblem(true)}>Something’s wrong</button>
              </div>
            )}
          </>
        )}

        {stage === "guaranteed" && picked && (
          <>
            <h2 className="display">Fixed and on record</h2>
            <div className="receipt">
              <dl>
                <div><dt>Work done by</dt><dd>{picked.name}</dd></div>
                <div><dt>Job</dt><dd>{shownWords}</dd></div>
                <div><dt>Paid</dt><dd className="num">{money(total)}</dd></div>
                <div><dt>Guarantee</dt><dd>{protect ? "30 days from today" : "Not protected"}</dd></div>
                <div><dt>Exact address</dt><dd>Removed from {picked.name}’s view</dd></div>
              </dl>
            </div>
            <p style={{ marginBottom: 20 }}>Need {picked.name} again? Rebooking here costs them less commission and keeps your guarantee.</p>
            <Link href="/job" className="btn">Find someone</Link>
          </>
        )}
      </div>
    </div>
  );
}
