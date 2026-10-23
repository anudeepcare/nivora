"use client";
import { useState } from "react";
import { authClient } from "@/lib/client";
import { Logo } from "./Ui";
export default function PasswordRecovery() {
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) {setError("The passwords do not match.");return;}
    setBusy(true);
    try {
      const {error} = await authClient().auth.updateUser({password});
      if (error) throw error;
      window.location.replace("/overview");
    } catch {
      setError("Your password could not be updated. Try a new recovery link if this one has expired.");
      setBusy(false);
    }
  }
  return <main className="recovery-page"><section className="login-card">
    <a href="/" className="auth-back">← AURYN</a><Logo/>
    <span className="eyebrow">Account recovery</span><h1>A fresh start.</h1>
    <p>Choose a new password to return to your investment workspace.</p>
    <form onSubmit={submit} aria-busy={busy}>
      <label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label>Confirm password<input type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="button primary" disabled={busy}>{busy?"Updating…":"Update password & continue"}</button>
    </form>
    <a href="/login">Return to sign in</a>
  </section></main>;
}
