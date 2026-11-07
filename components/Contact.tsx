"use client";
import styles from "./Contact.module.css";
import { APP_VERSION } from "@/lib/releases";
import { DocumentBack } from "./ContextLink";
import { newRequestId } from "@/lib/client-id";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { supportCategories } from "@/lib/support-input";
export default function Contact() {
  const [screenshot, setScreenshot] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
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
  async function selectScreenshot(file?: File) {
    setScreenshot("");
    setError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG or WebP image under 10 MB.");
      return;
    }
    setImageBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const ratio = Math.min(1, 1400 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Image processing is unavailable.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.65);
      if (data.length > 410000)
        throw Error("Screenshot is too detailed; crop it and try again.");
      setScreenshot(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read screenshot.");
    } finally {
      URL.revokeObjectURL(url);
      setImageBusy(false);
    }
  }
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
          ...(screenshot ? { screenshot } : {}),
          page: "/contact",
          ...(includeDiagnostics
            ? {
                diagnostics: {
                  version: APP_VERSION,
                  page:
                    new URLSearchParams(window.location.search).get("from") ||
                    "/contact",
                  viewport: `${window.innerWidth}×${window.innerHeight}`,
                },
              }
            : {}),
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
    <main className={`contact-page atlas-support ${styles.page}`}>
      <header>
        <Link href="/" className="legal-brand">
          <img src="/icon.svg" width="28" height="28" alt="" /> AURYN
        </Link>
        <DocumentBack />
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
          <small>
            App version {APP_VERSION}. Include this version when reporting an
            issue.
          </small>
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
            <label>
              Optional screenshot
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy || imageBusy}
                onChange={(e) => void selectScreenshot(e.target.files?.[0])}
              />
            </label>
            {imageBusy && <p role="status">Preparing screenshot…</p>}
            {screenshot && (
              <div>
                <img
                  src={screenshot}
                  alt="Screenshot selected for support"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 240,
                    objectFit: "contain",
                  }}
                />
                <button type="button" onClick={() => setScreenshot("")}>
                  Remove screenshot
                </button>
              </div>
            )}
            <p className="small muted">
              Review the image and remove private details before sending. Image
              metadata is removed when preparing it.
            </p>
            <label className={styles.diagnostics}>
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                disabled={busy}
              />{" "}
              Include app version, page category and screen size
            </label>
            <p className="small muted">
              No ticker, holdings, notes, URL parameters or account details are
              added.
            </p>
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
            <button
              className="button primary"
              disabled={busy || imageBusy || !id}
            >
              {busy ? "Saving your message…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
