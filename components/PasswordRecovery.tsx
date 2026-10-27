"use client";
import { useState } from "react";
import { authClient } from "@/lib/client";
import { PublicSample } from "./PublicLanding";
export default function PasswordRecovery() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await authClient().auth.updateUser({ password });
      if (error) throw error;
      window.location.replace("/overview");
    } catch {
      setError(
        "Your password could not be updated. Try a new recovery link if this one has expired.",
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
          <p>The decision. The reasons. Your AURYN Pace.</p>
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
            <h1>A fresh start.</h1>
            <p>Choose a new password to return to your investment workspace.</p>
          </div>
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
              <small id="auryn-new-password-hint">At least 8 characters.</small>
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
