"use client";

import { useState } from "react";
import { FEEDBACK_KINDS, FEEDBACK_MAX, FEEDBACK_MIN, type FeedbackKind } from "@/lib/feedback";

type State = "idle" | "sending" | "sent";

const ERRORS: Record<number, string> = {
  429: "That’s a lot of feedback at once. Try again in a few minutes.",
  503: "We couldn’t save that just now. Please try again later.",
};

export function FeedbackForm() {
  const [kind, setKind] = useState<FeedbackKind>("problem");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim().length < FEEDBACK_MIN) {
      setError(`Tell us a little more: at least ${FEEDBACK_MIN} characters.`);
      return;
    }
    setError(null);
    setState("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message }),
      });
      if (!response.ok) {
        setError(ERRORS[response.status] ?? "That didn’t send. Please check it and try again.");
        setState("idle");
        return;
      }
      setMessage("");
      setState("sent");
    } catch {
      setError("That didn’t send. Check your connection and try again.");
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="feedback__sent" role="status">
        <h2 className="display feedback__thanks">Thanks, we got it</h2>
        <p>Your note is saved. We can’t reply to it, because we don’t ask who you are.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setState("idle")}>Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={send} method="post" noValidate>
      <fieldset className="field">
        <legend>What kind of note is this?</legend>
        <div className="choice" style={{ marginTop: 6 }}>
          {(Object.keys(FEEDBACK_KINDS) as FeedbackKind[]).map((option) => (
            <label key={option}>
              <input type="radio" checked={kind === option} onChange={() => setKind(option)} />
              <span>{FEEDBACK_KINDS[option]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Your note</span>
        <textarea
          className="input feedback__text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={FEEDBACK_MAX}
          placeholder="What happened, and on which page?"
          aria-invalid={error !== null}
          aria-describedby="feedback-help"
        />
        <small className="feedback__help" id="feedback-help">Please leave out names, numbers and addresses.</small>
      </label>
      {error && <p className="alert" role="alert" style={{ marginBottom: 20 }}>{error}</p>}
      <button type="submit" className="btn" disabled={state === "sending"}>{state === "sending" ? "Sending" : "Send feedback"}</button>
      <noscript><p style={{ marginTop: 12 }}>This form needs JavaScript.</p></noscript>
    </form>
  );
}
