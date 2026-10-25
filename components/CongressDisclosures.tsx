"use client";
import { useState } from "react";
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
  async function load() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setResult(await api(`congress?symbol=${encodeURIComponent(symbol)}`));
    } catch {
      setError(
        "Disclosures could not be checked. Company news and other evidence remain available.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="congress-disclosures">
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
            <div className="congress-list">
              {result.rows.map((r) => (
                <article key={r.id}>
                  <div>
                    <strong>{r.member}</strong>
                    <small>
                      {r.chamber === "house" ? "House" : "Senate"}
                      {r.owner ? ` · ${r.owner}` : ""}
                    </small>
                  </div>
                  <div>
                    <strong>
                      {r.action[0].toUpperCase() + r.action.slice(1)}
                    </strong>
                    <small>{r.amountRange}</small><small>{r.assetType}{r.assetDescription ? ` · ${r.assetDescription}` : ''}</small>
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
        <p className="desk-footnote">
          Load disclosures when useful. Results are cached to avoid repeated
          requests.
        </p>
      )}
      <p className="desk-footnote">
        Amounts are reported ranges. Filings can be delayed or amended, and
        activity may belong to a spouse or dependent. These records do not
        establish a suitable entry or a trading advantage.
      </p>
    </section>
  );
}
