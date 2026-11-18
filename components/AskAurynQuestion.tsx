"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useProduct } from "./Session";
import type { Evidence } from "@/lib/report";
import styles from "./AskAurynQuestion.module.css";
type Answer = {
  claims: { text: string; evidenceIds: string[] }[];
  facts: Evidence[];
  sources: Evidence[];
  limitations: string[];
  generatedAt: string;
};
export default function AskAurynQuestion({ symbol }: { symbol: string }) {
  const { demo } = useProduct();
  const [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [answer, setAnswer] = useState<Answer | null>(null),
    [error, setError] = useState("");
  return (
    <section className={styles.ask} aria-label="Ask a stock question">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || demo) return;
          setBusy(true);
          setError("");
          setAnswer(null);
          try {
            setAnswer(
              await api<Answer>(`ask/${encodeURIComponent(symbol)}`, {
                question,
              }),
            );
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Question could not be answered.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor={`ask-${symbol}`}>Your question about {symbol}</label>
        <textarea
          id={`ask-${symbol}`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={1200}
          minLength={3}
          required
          disabled={busy || !!demo}
          rows={3}
          placeholder="What supports the growth case, and what evidence is missing?"
        />
        <div className={styles.actions}>
          <small>
            Your question and selected company evidence are sent to the
            configured AI provider. Do not include private financial details.
            Account AI limits apply.
          </small>
          <button
            type="submit"
            disabled={busy || !!demo || question.trim().length < 3}
          >
            {busy ? "Reviewing evidence…" : "Ask AURYN"}
          </button>
        </div>
      </form>
      {demo && <p>AI questions are disabled in this design preview.</p>}
      {busy && (
        <p role="status">Reviewing the available evidence for {symbol}…</p>
      )}
      {error && <p role="alert">{error}</p>}
      {answer && (
        <div aria-live="polite">
          {answer.claims.map((claim, index) => (
            <div key={index}>
              <p>{claim.text}</p>
              <small>
                {claim.evidenceIds.map((id) => {
                  const source = answer.sources.find((s) => s.id === id);
                  return source ? (
                    <a
                      key={id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.label} · {source.period}{" "}
                    </a>
                  ) : null;
                })}
              </small>
            </div>
          ))}
          {!!answer.facts.length && (
            <dl className={styles.facts}>
              {answer.facts.map((f) => (
                <div key={f.id}>
                  <dt>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.label}
                    </a>
                  </dt>
                  <dd>
                    {f.value?.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {f.unit}
                  </dd>
                  <small>
                    Period {f.period} · recorded {f.filed}
                  </small>
                </div>
              ))}
            </dl>
          )}
          <details>
            <summary>Evidence limits</summary>
            {answer.limitations.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </details>
          {!answer.claims.length && (
            <p>No eligible evidence was available to answer this question.</p>
          )}
          <small>
            AI-generated interpretation. Verify claims against sources.
            Generated {new Date(answer.generatedAt).toLocaleString()}.
          </small>
        </div>
      )}
    </section>
  );
}
