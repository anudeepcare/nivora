"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supportCategories } from "@/lib/support-input";
export default function Contact() {
  const [email, setEmail] = useState(""),
    [category, setCategory] = useState<string>(supportCategories[0]),
    [message, setMessage] = useState(""),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState(false),
    [reference, setReference] = useState(""),
    [id, setId] = useState("");
  useEffect(() => {
    setId(crypto.randomUUID());
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          email,
          category,
          message,
          website,
          page: "/contact",
        }),
      });
      const value = await response.json();
      if (!response.ok || !value.saved)
        throw Error(value.error ?? "Message could not be saved.");
      setReference(value.reference);
      setReceipt(value.receiptSent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="contact-page">
      <header>
        <Link href="/" className="legal-brand">
          AURYN
        </Link>
        <Link href="/help">Help & answers →</Link>
      </header>
      <span className="edge-eyebrow">WE’RE LISTENING</span>
      <h1>How can we help?</h1>
      <p>A question, a concern, or an idea for AURYN. Send it here.</p>
      {reference ? (
        <section role="status" className="contact-confirmation">
          <h2>Your message is saved.</h2>
          <p>
            Reference: <strong>{reference.slice(0, 8)}</strong>
          </p>
          <p>
            {receipt
              ? "A confirmation email has been sent."
              : "Keep this reference. Email confirmation is pending."}
          </p>
          <Link href="/overview" className="button primary">
            Back to AURYN
          </Link>
        </section>
      ) : (
        <form onSubmit={submit}>
          <label>
            Your reply email
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            Topic
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
            >
              {supportCategories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Message
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              placeholder="Tell us what happened or what you need."
            />
          </label>
          <label className="contact-honeypot" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <p className="small muted">
            Please don’t include passwords, API keys or payment card details. We
            use your email to respond. <Link href="/privacy">Privacy</Link>
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy || !id}>
            {busy ? "Saving your message…" : "Send message"}
          </button>
        </form>
      )}
    </main>
  );
}
