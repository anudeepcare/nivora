"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./CongressDisclosures.module.css";
import { api } from "@/lib/client";
import { dateLabel } from "@/lib/format";
import type { CongressDisclosure } from "@/lib/congress-disclosures";
export default function CongressDisclosures({
  symbol,
  preview = false,
}: {
  symbol: string;
  preview?: boolean;
}) {
  const [result, setResult] = useState<{
      rows: CongressDisclosure[];
      asOf: string;
      truncated: boolean;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setBusy(true);
    setError("");
    try {
      const data = await api<{
        rows: CongressDisclosure[];
        asOf: string;
        truncated: boolean;
      }>(`congress?symbol=${encodeURIComponent(symbol)}`);
      if (current === request.current) setResult(data);
    } catch {
      if (current === request.current)
        setError(
          "Disclosures could not be checked. Company news and other evidence remain available.",
        );
    } finally {
      if (current === request.current) setBusy(false);
    }
  }, [symbol]);
  useEffect(() => {
    setResult(null);
    if (!preview) void load();
    return () => {
      request.current += 1;
    };
  }, [load, preview]);
  return (
    <section className={`congress-disclosures ${styles.panel}`}>
      <header className="section-head">
        <div>
          <span className="eyebrow">
            REPORTED ACTIVITY · DELAYED DISCLOSURES
          </span>
          <h3>Congressional transactions</h3>
          <p>See when an activity was reported—not who is trading right now.</p>
        </div>
        {!preview && (
          <button className="button" onClick={load} disabled={busy}>
            {busy
              ? "Checking filings…"
              : result
                ? "Refresh disclosures"
                : "Check reported activity"}
          </button>
        )}
      </header>
      {preview ? (
        <p className="desk-footnote">
          This preview does not request live disclosures or invent member
          transactions.
        </p>
      ) : error ? (
        <p role="status" className="desk-footnote">
          {error}
        </p>
      ) : result ? (
        <>
          <p className="desk-footnote">
            Last 180 days · checked {dateLabel(result.asOf)}.{" "}
            {result.truncated
              ? "Up to 100 records shown; this is not a complete activity history."
              : ""}
          </p>
          {result.rows.length ? (
            <div className={`congress-list ${styles.list}`}>
              {result.rows.map((r) => (
                <article
                  key={r.id}
                  className={styles.row}
                  data-action={r.action}
                >
                  <div>
                    <strong>{r.member}</strong>
                    <small>
                      {r.chamber === "house" ? "House" : "Senate"}
                      {r.owner ? ` · ${r.owner}` : ""}
                    </small>
                  </div>
                  <div>
                    <strong className={styles.action}>
                      {r.action[0].toUpperCase() + r.action.slice(1)}
                    </strong>
                    <small>{r.amountRange}</small>
                    <small>
                      {r.assetType}
                      {r.assetDescription ? ` · ${r.assetDescription}` : ""}
                    </small>
                  </div>
                  <div>
                    <span>Traded {dateLabel(r.traded)}</span>
                    <small>
                      Disclosed {dateLabel(r.disclosed)} · {r.lagDays} days
                      later
                    </small>
                  </div>
                  <a
                    href={r.filingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Original filing ↗
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="desk-footnote">
              No matching disclosures were returned for this period. This does
              not prove no transactions occurred.
            </p>
          )}
        </>
      ) : (
        <p className="desk-footnote">Checking reported disclosures…</p>
      )}
      <p className="desk-footnote">
        Amounts are reported ranges. Filings can be delayed or amended, and
        activity may belong to a spouse or dependent. These records do not
        establish a suitable entry or a trading advantage.
      </p>
    </section>
  );
}
