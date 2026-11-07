"use client";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/pace-record", { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Publication feed is unavailable.");
        return r.json();
      })
      .then((r) => setRows(r.records))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);
  return (
    <section aria-label="Published Pace observations">
      <h2>Dated observations</h2>
      {error ? (
        <p role="status">{error} Methodology remains available below.</p>
      ) : rows === null ? (
        <p role="status">Loading the publication feed…</p>
      ) : !rows.length ? (
        <p>The current policy’s publication record has not started yet.</p>
      ) : (
        rows.map((r) => (
          <article key={r.id}>
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
      <p>
        Latest 100 records. Publication time is when we recorded the
        observation, not when an earlier signal first became available.
        Subsequent outcomes are not implied. Database records and hashes alone
        are not independent timestamp certification.
      </p>
    </section>
  );
}
