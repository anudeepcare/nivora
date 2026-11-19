"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useProduct } from "./Session";
import type { Evidence } from "@/lib/report";
import styles from "./AskAurynQuestion.module.css";
type Answer = {
  publicNewsSearch?: { status: string; days: number; observations: number };
  claims: {
    text: string;
    evidenceIds: string[];
    kind?: "answer" | "interpretation";
  }[];
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
  const [publicSearch, setPublicSearch] = useState({
    symbol,
    enabled: false,
    topic: "",
    days: 7 as 7 | 14,
  });
  const search =
    publicSearch.symbol === symbol
      ? publicSearch
      : { symbol, enabled: false, topic: "", days: 7 as 7 | 14 };
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
                ...(search.enabled
                  ? {
                      publicNewsSearch: {
                        enabled: true,
                        topic: search.topic,
                        days: search.days,
                      },
                    }
                  : {}),
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
        <label className={styles.searchOptIn}>
          <input
            type="checkbox"
            checked={search.enabled}
            disabled={busy || !!demo}
            onChange={(e) =>
              setPublicSearch({
                symbol,
                enabled: e.target.checked,
                topic: "",
                days: 7,
              })
            }
          />
          <span>Search SentiSense for a public news topic about {symbol}</span>
        </label>
        {search.enabled && (
          <div className={styles.publicSearch}>
            <label htmlFor={`public-topic-${symbol}`}>Public topic only</label>
            <input
              id={`public-topic-${symbol}`}
              name="public-topic"
              value={search.topic}
              required
              minLength={2}
              maxLength={239 - symbol.length}
              disabled={busy || !!demo}
              onChange={(e) =>
                setPublicSearch({ ...search, topic: e.target.value })
              }
              placeholder="e.g. product launch"
            />
            <label htmlFor={`public-days-${symbol}`}>News window</label>
            <select
              id={`public-days-${symbol}`}
              value={search.days}
              disabled={busy || !!demo}
              onChange={(e) =>
                setPublicSearch({
                  ...search,
                  days: Number(e.target.value) as 7 | 14,
                })
              }
            >
              <option value={7}>Past 7 days</option>
              <option value={14}>Past 14 days</option>
            </select>
            <small>
              Sent to SentiSense when you submit: {symbol}
              {search.topic.trim()
                ? ` ${search.topic.trim()}`
                : " + your public topic"}
              ; {search.days} days, up to 20 story summaries. Your question and
              portfolio are not sent to SentiSense. Do not enter private details
              in this topic. Automated privacy checks are limited. This replaces
              the ordinary news feed for this question.
            </small>
          </div>
        )}
        <div className={styles.actions}>
          <small>
            Your question and selected company evidence are sent to the
            configured AI provider. Do not include private financial details. AI
            answers and their automated review can be wrong. This is limited
            company research, not personal trading advice. Account AI limits
            apply.
          </small>
          <button
            type="submit"
            disabled={
              busy ||
              !!demo ||
              question.trim().length < 3 ||
              (search.enabled && search.topic.trim().length < 2)
            }
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
          {answer.publicNewsSearch && (
            <p>
              Public-topic search: {answer.publicNewsSearch.status} ·{" "}
              {answer.publicNewsSearch.observations} eligible observations in
              the past {answer.publicNewsSearch.days} days.
            </p>
          )}
          {answer.claims.map((claim, index) => (
            <div key={index}>
              <strong>
                {claim.kind === "interpretation"
                  ? "AI interpretation"
                  : "Short answer"}
              </strong>
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
                    {f.passage || (
                      <>
                        {f.value?.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {f.unit}
                      </>
                    )}
                  </dd>
                  <small>
                    Period {f.period} ·{" "}
                    {f.id.startsWith("T-") ? "checked" : "recorded"} {f.filed}
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
