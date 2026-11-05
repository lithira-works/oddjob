"use client";

import { useState } from "react";

const post = (path: string, body: object) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const response = await post("/api/admin/login", { email, password });
      if (response.ok) {
        window.location.assign("/admin");
        return;
      }
      setPassword("");
      setError(
        response.status === 401 ? "Email or password is wrong."
        : response.status === 429 ? "Too many tries. Wait 15 minutes, then try again."
        : "That didn’t work. Please try again.",
      );
    } catch {
      setError("That didn’t send. Check your connection and try again.");
    }
    setSending(false);
  };

  return (
    <form onSubmit={send} method="post" noValidate>
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" value={email} maxLength={254} autoComplete="username" spellCheck={false} autoFocus onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span>Password</span>
        <input className="input" type="password" value={password} maxLength={200} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="alert admin__error" role="alert">{error}</p>}
      <button type="submit" className="btn auth__go" disabled={sending}>{sending ? "Checking" : "Log in"}</button>
      <noscript><p className="admin__error">This form needs JavaScript.</p></noscript>
    </form>
  );
}

export function AdminLogout() {
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const leave = async () => {
    setSending(true);
    setFailed(false);
    try {
      const response = await post("/api/admin/logout", {});
      if (response.ok) {
        window.location.assign("/admin/login");
        return;
      }
    } catch {
      // Handled below: the person is still logged in, so say so.
    }
    setFailed(true);
    setSending(false);
  };

  return (
    <button type="button" className="btn btn--small btn--white" onClick={leave} disabled={sending}>
      {sending ? "Logging out" : failed ? "Try again" : "Log out"}
    </button>
  );
}
