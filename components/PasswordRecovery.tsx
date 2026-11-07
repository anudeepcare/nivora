"use client";
import { useEffect, useState } from "react";

import { PublicSample } from "./PublicLanding";
export default function PasswordRecovery() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/recovery", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = await response.json();
        if (!controller.signal.aborted) {
          setReady(response.ok && !!value.email);
          setEmail(response.ok ? value.email : "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setError("");
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setPassword("");
      setConfirm("");
      setComplete(true);
      setReady(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your password could not be updated. Try a new recovery link if this one has expired.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="mp-auth ap-auth" data-auth-mode="recovery">
      <aside className="mp-auth-story" aria-label="About AURYN">
        <a className="mp-brand" href="/" aria-label="Auryn home">
          <span className="mp-brand-mark" aria-hidden="true">
            <img src="/icon.svg" alt="" width="34" height="36" />
          </span>
          <span>AURYN</span>
        </a>
        <div className="mp-auth-story-copy">
          <span className="mp-overline">INVEST WITH UNDERSTANDING</span>
          <h2>
            Know the stock.
            <br />
            <em>Know your next move.</em>
          </h2>
          <p>Business first. A clear decision. Your pace for gradual buying.</p>
        </div>
        <PublicSample compact />
        <div className="mp-auth-story-footer">
          <span>A clearer case. A considered pace.</span>
          <span>Research supports your judgment. Investing involves risk.</span>
        </div>
      </aside>
      <section className="mp-auth-main" aria-label="Account recovery">
        <div className="mp-auth-mobile-brand">
          <a className="mp-brand" href="/" aria-label="Auryn home">
            <span className="mp-brand-mark" aria-hidden="true">
              <img src="/icon.svg" alt="" width="29" height="31" />
            </span>
            <span>AURYN</span>
          </a>
        </div>
        <a href="/" className="mp-auth-home">
          ← Back to Auryn
        </a>
        <div className="mp-auth-panel mp-reset-panel">
          <div className="mp-auth-heading">
            <span className="mp-overline">ACCOUNT RECOVERY</span>
            <h1>Reset your password</h1>
            <p>Choose a new password to return to your investment workspace.</p>
          </div>
          {complete && (
            <p role="status">
              Your password was updated.{" "}
              <a href="/overview">Continue to your workspace</a>
            </p>
          )}
          {ready && (
            <p>
              Reset password for <strong>{email}</strong>
            </p>
          )}
          {checking ? (
            <p role="status">Checking your reset link…</p>
          ) : !ready && !complete ? (
            <p role="alert">
              This reset link has expired or could not be verified in this
              browser. <a href="/login?mode=reset">Request a new reset link</a>{" "}
              and open it in the same browser where you requested it.
            </p>
          ) : null}
          {ready && (
            <form className="mp-auth-form" onSubmit={submit} aria-busy={busy}>
              <div className="mp-form-field">
                <label htmlFor="auryn-new-password">New password</label>
                <input
                  id="auryn-new-password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  aria-describedby="auryn-new-password-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <small id="auryn-new-password-hint">
                  At least 8 characters.
                </small>
              </div>
              <div className="mp-form-field">
                <label htmlFor="auryn-confirm-password">Confirm password</label>
                <input
                  id="auryn-confirm-password"
                  name="confirm-password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="mp-form-message error">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="mp-button mp-button-primary mp-form-submit"
                disabled={busy}
              >
                {busy ? "Updating…" : "Update password & continue"}
              </button>
            </form>
          )}
          <a href="/login" className="mp-back-link">
            ← Return to sign in
          </a>
          <div className="mp-auth-disclaimer">
            <span>
              Your password is updated securely for this account.{" "}
              <a href="/help">Get help with account access.</a>
            </span>
          </div>
        </div>
        <div className="mp-auth-help">
          <a href="/privacy">Privacy</a>
          <span>·</span>
          <a href="/terms">Terms</a>
        </div>
      </section>
    </main>
  );
}
