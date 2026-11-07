"use client";
import { useEffect, useState } from "react";
import s from "./PublicFrame.module.css";
type Row = {
  id: number;
  published_at: string;
  symbol: string;
  signal_period: string;
  policy: string;
  pace: number;
  reference_price: number;
  quote_at: string;
  policy_hash: string;
  evidence_hash: string;
};
export default function PaceRecordFeed() {
  const [rows, setRows] = useState<Row[] | null>(null),
    [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setError("");
    fetch("/api/pace-record", { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Publication feed is unavailable.");
        return r.json();
      })
      .then((r) => {
        if (!Array.isArray(r.records))
          throw Error("Publication feed returned an invalid response.");
        setRows(r.records);
        setStatus(r.status || "ready");
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [retry]);
  return (
    <section aria-label="Published Pace observations">
      <h2>Dated observations</h2>
      {error ? (
        <div className={s.notice} role="status">
          <p>
            We could not load the observations. The methodology below remains
            available.
          </p>
          <button onClick={() => setRetry((n) => n + 1)}>
            Retry observations
          </button>
        </div>
      ) : rows === null ? (
        <p role="status">Loading the publication feed…</p>
      ) : status === "publication-disabled" ? (
        <p className={s.notice}>
          Public observations are not enabled yet. Explore how Pace works and
          how results will be evaluated below.
        </p>
      ) : !rows.length ? (
        <p className={s.notice}>
          No observations have been published for the current policy yet.
          Published records will appear here with their dates and evidence.
        </p>
      ) : (
        rows.map((r) => (
          <article key={r.id} className={s.record}>
            <h3>
              {r.symbol} · P{r.pace}
            </h3>
            <p>
              Completed signal: {r.signal_period} · Recorded{" "}
              {new Date(r.published_at).toLocaleString()} · Reference $
              {Number(r.reference_price).toFixed(2)}
            </p>
            <details>
              <summary>Inspect evidence receipt</summary>
              <p>
                Policy: {r.policy}. Quote: {r.quote_at}.
              </p>
              <p style={{ overflowWrap: "anywhere" }}>
                Policy fingerprint: {r.policy_hash}
                <br />
                Evidence fingerprint: {r.evidence_hash}
              </p>
            </details>
          </article>
        ))
      )}
      <details>
        <summary>How to read this record</summary>
        <p>
          Latest 100 records. Publication time is when we recorded the
          observation, not when an earlier signal first became available.
          Subsequent outcomes are not implied. Database records and hashes alone
          are not independent timestamp certification.
        </p>
      </details>
    </section>
  );
}
