"use client";

import { Hammer, House } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cleanFirstName, CODE_LENGTH, homeFor, isCodeShaped, MAX_CODE_TRIES, normalisePhone, type Side } from "@/lib/auth";
import { PREVIEW_CODE, startPreviewSession } from "@/lib/preview-session";

const PANELS: Record<"login" | Side, { title: string; lines: string[] }> = {
  login: { title: "Welcome back", lines: ["Your jobs and replies", "Your chats, with numbers hidden", "No password to remember"] },
  household: { title: "Get it fixed", lines: ["Asking costs nothing", "Up to five people reply", "Your address stays yours"] },
  worker: { title: "Get more work", lines: ["See homes that need help", "Pay only for the jobs you answer", "Fake leads get their credits back"] },
};

const SIDES: { value: Side; label: string; Icon: typeof House }[] = [
  { value: "household", label: "I need a hand", Icon: House },
  { value: "worker", label: "I do this work", Icon: Hammer },
];

/**
 * The whole account flow, on preview rules: no text is sent and nothing leaves this browser.
 * Inputs have no `name`, so even without script a phone number can't reach a URL or the server.
 */
export function AuthForm({ mode, initialSide }: { mode: "login" | "signup"; initialSide: Side }) {
  const router = useRouter();
  const [side, setSide] = useState(initialSide);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "code">("details");
  const [tries, setTries] = useState(0);
  const [error, setError] = useState<{ field: "name" | "phone" | "code" | "form"; text: string } | null>(null);

  const signup = mode === "signup";
  const panel = PANELS[signup ? side : "login"];

  const sendCode = (event: React.FormEvent) => {
    event.preventDefault();
    if (signup && !cleanFirstName(firstName)) {
      setError({ field: "name", text: "Enter your first name, using letters only." });
      return;
    }
    if (!normalisePhone(phone)) {
      setError({ field: "phone", text: "Enter a mobile number, like 07X XXX XXXX, or start with + and the country code." });
      return;
    }
    setError(null);
    setTries(0);
    setCode("");
    setStep("code");
  };

  const startOver = (message?: string) => {
    setStep("details");
    setCode("");
    setTries(0);
    setError(message ? { field: "form", text: message } : null);
  };

  const checkCode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isCodeShaped(code)) {
      setError({ field: "code", text: `Enter all ${CODE_LENGTH} digits.` });
      return;
    }
    if (code.trim() !== PREVIEW_CODE) {
      const used = tries + 1;
      if (used >= MAX_CODE_TRIES) {
        startOver("Too many wrong codes. Start again.");
        return;
      }
      setTries(used);
      setError({ field: "code", text: `That code is wrong. ${MAX_CODE_TRIES - used} ${MAX_CODE_TRIES - used === 1 ? "try" : "tries"} left.` });
      return;
    }
    startPreviewSession(signup ? { firstName: cleanFirstName(firstName), side } : { firstName: null, side: null });
    setPhone("");
    router.push(signup ? homeFor(side) : "/");
  };

  const lastDigits = (normalisePhone(phone) ?? "").slice(-2);

  return (
    <div className="auth">
      <div className={`auth__panel ${!signup ? "auth__panel--login on-dark" : side === "worker" ? "auth__panel--worker on-accent" : ""}`}>
        <h1 className="display auth__title">{panel.title}</h1>
        <ul className="auth__lines">
          {panel.lines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>

      <div className="auth__main">
        {step === "details" && (
          <p className="sample-note auth__preview">
            Preview: accounts aren’t open yet. Nothing you type here leaves this browser, so use a made-up number.
          </p>
        )}

        {error?.field === "form" && <p className="alert" role="alert">{error.text}</p>}

        {step === "details" ? (
          <form onSubmit={sendCode} method="post" noValidate>
            {signup && (
              <fieldset className="field">
                <legend>What brings you here?</legend>
                <div className="choice choice--sides">
                  {SIDES.map(({ value, label, Icon }) => (
                    <label key={value}>
                      <input type="radio" checked={side === value} onChange={() => setSide(value)} />
                      <span><Icon size={22} strokeWidth={1.75} aria-hidden="true" />{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {signup && (
              <label className="field">
                <span>First name</span>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  maxLength={40}
                  aria-invalid={error?.field === "name"}
                  aria-describedby={error?.field === "name" ? "auth-error" : undefined}
                />
                {error?.field === "name" && <small className="field__error" id="auth-error" role="alert">{error.text}</small>}
              </label>
            )}
            <label className="field">
              <span>Mobile number</span>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="07X XXX XXXX"
                maxLength={20}
                aria-invalid={error?.field === "phone"}
                aria-describedby={error?.field === "phone" ? "auth-error" : undefined}
              />
              {error?.field === "phone" && <small className="field__error" id="auth-error" role="alert">{error.text}</small>}
            </label>
            <button type="submit" className="btn auth__go">{signup ? "Create my account" : "Send my code"}</button>
            <noscript><p style={{ marginTop: 12 }}>This form needs JavaScript in this preview.</p></noscript>
          </form>
        ) : (
          <form onSubmit={checkCode} method="post" noValidate>
            <p className="lead auth__sent">Enter the code for the number ending {lastDigits}.</p>
            <p className="sample-note auth__preview">Preview: no text was sent. The code is {PREVIEW_CODE}.</p>
            <label className="field">
              <span>{CODE_LENGTH}-digit code</span>
              <input
                className="input auth__code num"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                autoFocus
                aria-invalid={error?.field === "code"}
                aria-describedby={error?.field === "code" ? "auth-error" : undefined}
              />
              {error?.field === "code" && <small className="field__error" id="auth-error" role="alert">{error.text}</small>}
            </label>
            <button type="submit" className="btn auth__go">{signup ? "Finish" : "Log in"}</button>
            <button type="button" className="link auth__back" onClick={() => startOver()}>Use another number</button>
          </form>
        )}

        <p className="auth__switch">
          {signup
            ? <>Already joined? <Link href="/login" className="link">Log in</Link></>
            : <>New here? <Link href="/signup" className="link">Create an account</Link></>}
        </p>
        {signup && <p className="small auth__terms">Terms and a privacy policy come before accounts open.</p>}
      </div>
    </div>
  );
}
