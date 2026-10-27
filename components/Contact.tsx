"use client";
import { newRequestId } from "@/lib/client-id";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
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
    setId(newRequestId());
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
    <main className="contact-page atlas-support">
      <header>
        <Link href="/" className="legal-brand">
          <img src="/icon.svg" width="28" height="28" alt="" /> AURYN
        </Link>
        <Link href="/help">Help & answers →</Link>
      </header>
      <div className="support-frame">
        <section className="support-introduction">
          <span className="edge-eyebrow">WE’RE LISTENING</span>
          <h1>
            How can
            <br />
            we help?
          </h1>
          <p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
          <p>A question, a concern, or an idea for AURYN. Send it here.</p>
          <div className="support-promise">
            <ShieldCheck size={20} />
            <div>
              <strong>Your message stays private.</strong>We use your reply
              email to respond. Please leave out passwords, API keys and payment
              details.
            </div>
          </div>
        </section>
        {reference ? (
          <section role="status" className="contact-confirmation">
            <CheckCircle2 size={28} />
            <h2>Your message is saved.</h2>
            <p>
              <span className="contact-reference">
                Reference: {reference.slice(0, 8)}
              </span>
            </p>
            <p>
              {receipt
                ? "A confirmation email has been sent."
                : "Keep this reference. Your message is saved even if a confirmation email has not arrived."}
            </p>
            <Link href="/overview" className="button primary">
              Back to AURYN <ArrowRight size={15} />
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
              Please don’t include passwords, API keys or payment card details.
              We use your email to respond. <Link href="/privacy">Privacy</Link>
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
      </div>
    </main>
  );
}
