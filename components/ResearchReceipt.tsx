"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Research } from "@/lib/types";
import { latestFinancialEvidence } from "@/lib/analysis";
import {
  periodReceipts,
  receiptMarkdown,
  comparePassages,
} from "@/lib/research-receipt";
import { earningsReview, earningsThesisChecks } from "@/lib/earnings-review";
import s from "./ResearchReceipt.module.css";
export default function ResearchReceipt({
  research: r,
  onClose,
}: {
  research: Research;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("metrics"),
    [before, setBefore] = useState(""),
    [after, setAfter] = useState(""),
    [diff, setDiff] = useState<ReturnType<typeof comparePassages>>([]),
    [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const financial = useMemo(() => latestFinancialEvidence(r), [r]);
  const receipts = useMemo(
    () =>
      periodReceipts(
        financial.latest,
        financial.prior,
        r.retrievedAt.slice(0, 10),
      ),
    [financial, r.retrievedAt],
  );
  const earnings = useMemo(
    () =>
      earningsReview(r.evidence?.earnings ?? [], r.retrievedAt.slice(0, 10)),
    [r.evidence, r.retrievedAt],
  );
  const checks = earningsThesisChecks(financial.latest, financial.prior);
  function download() {
    const blob = new Blob(
      [
        receiptMarkdown({
          symbol: r.company.symbol,
          name: r.company.name,
          observedAt: r.retrievedAt,
          receipts,
        }),
      ],
      { type: "text/markdown;charset=utf-8" },
    );
    const u = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = u;
    a.download = `${r.company.symbol.replace(/[^A-Za-z0-9.-]/g, "_")}-research.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      onClose={onClose}
      aria-label={`${r.company.symbol} evidence receipt`}
    >
      <header>
        <div>
          <span>
            {r.company.symbol} · {r.retrievedAt.slice(0, 10)}
          </span>
          <h2>Evidence behind the numbers</h2>
        </div>
        <button
          aria-label="Close evidence"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
      </header>
      <nav aria-label="Evidence views">
        {[
          ["metrics", "Metric receipts"],
          ["review", "Earnings & risks"],
          ["filings", "Compare passages"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "metrics" && (
        <>
          <p>
            Selected {financial.periodBasis} financial period. Missing inputs
            remain unavailable; each formula uses the stated period and
            currency.
          </p>
          {receipts.length ? (
            receipts.map((x) => (
              <section key={x.label}>
                <h3>
                  {x.label}
                  <strong>
                    {x.value === null
                      ? "Unavailable"
                      : `${x.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${x.unit}`}
                  </strong>
                </h3>
                <small>Period ended {x.period}</small>
                <p>
                  {x.formula} {x.gap}
                </p>
                {x.sources.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    Source {i + 1} ↗
                  </a>
                ))}
              </section>
            ))
          ) : (
            <p>
              Comparable financial statements are not available in this
              snapshot.
            </p>
          )}
          <button onClick={download} disabled={!receipts.length}>
            Download research card
          </button>
          <small>
            Only the public metrics above are exported. No account holdings or
            private notes.
          </small>
        </>
      )}
      {tab === "review" && (
        <>
          <h3>Latest earnings evidence</h3>
          {earnings ? (
            <p>
              {earnings.date} · {earnings.label}. Actual EPS{" "}
              {earnings.actual ?? "unavailable"}; estimate{" "}
              {earnings.estimate ?? "unavailable"}. Reported and adjusted bases
              are not reconciled.
            </p>
          ) : (
            <p>No dated earnings result is available.</p>
          )}
          <h3>Challenge the case</h3>
          <p>
            Use the same evidence to test what could invalidate your view. These
            are review prompts, not predictions.
          </p>
          <ul>
            {checks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {!checks.length && (
            <p>Comparable statements are needed before measuring changes.</p>
          )}
          <ul>
            <li>Does cash generation support the growth assumptions?</li>
            <li>Could funding needs or dilution change the per-share case?</li>
            <li>
              Would your position still fit if the bear-case assumptions
              occurred?
            </li>
          </ul>
          <p>
            {r.issues.length
              ? `${r.issues.length} source coverage issue(s) remain in the research snapshot.`
              : "Review the dated sources; absence of a coverage issue does not establish completeness."}
          </p>
        </>
      )}
      {tab === "filings" && (
        <>
          <p>
            Open the relevant filings, then paste matching sections below. This
            compares supplied text; it does not verify document selection or
            infer sentiment.
          </p>
          <div className={s.sources}>
            {r.filings.slice(0, 6).map((f) => (
              <a
                key={f.url}
                href={/^https:\/\//.test(f.url) ? f.url : undefined}
                target="_blank"
                rel="noreferrer"
              >
                {f.form} · {f.date} ↗
              </a>
            ))}
          </div>
          <div className={s.compare}>
            <label>
              Earlier passage
              <textarea
                value={before}
                maxLength={30000}
                onChange={(e) => setBefore(e.target.value)}
              />
            </label>
            <label>
              Later passage
              <textarea
                value={after}
                maxLength={30000}
                onChange={(e) => setAfter(e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={!before.trim() || !after.trim()}
            onClick={() => {
              try {
                setDiff(comparePassages(before, after));
                setError("");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not compare.");
              }
            }}
          >
            Compare text
          </button>
          {error && <p role="alert">{error}</p>}
          <div className={s.diff}>
            {diff.map((line, i) => (
              <p key={i} data-change={line.kind}>
                <b>
                  {line.kind === "added"
                    ? "+ "
                    : line.kind === "removed"
                      ? "− "
                      : "  "}
                </b>
                {line.text}
              </p>
            ))}
          </div>
        </>
      )}
    </dialog>
  );
}
