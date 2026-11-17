"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import { institutionRows } from "@/lib/institution-view";
import IntelligenceTable from "./IntelligenceTable";
export default function InstitutionDetail({ cik }: { cik: string }) {
  const [history, setHistory] = useState(false);
  const r = useResource<SentiSenseResult>(
    `institution/${encodeURIComponent(cik)}?view=${history ? "history" : "profile"}`,
    undefined,
    900000,
  );
  const d = r.data?.data as Record<string, unknown> | null;
  return (
    <div>
      <div role="group" aria-label="Institution evidence">
        <button
          className="btn"
          aria-pressed={!history}
          onClick={() => setHistory(false)}
        >
          Dated holdings
        </button>
        <button
          className="btn"
          aria-pressed={history}
          onClick={() => setHistory(true)}
        >
          Eight-quarter history
        </button>
      </div>
      {r.loading ? (
        <p role="status">Loading institution filings…</p>
      ) : r.error ||
        !["available", "preview"].includes(r.data?.status ?? "") ? (
        <p role="status">
          Institution evidence unavailable.{" "}
          <button onClick={r.refresh}>Retry institution</button>
        </p>
      ) : (
        <>
          <h4>{String(d?.displayName ?? "Reported institution")}</h4>
          <p>
            Long US-listed equity filings, not total firm assets or investment
            returns. Shorts, futures, non-US holdings and option notional are
            excluded. {r.data?.isPreview ? "Limited subscription preview." : ""}
          </p>
          {!history && (
            <p>
              Latest available filing: quarter ended{" "}
              {String(d?.latestReportDate ?? "not supplied")}. This may differ
              from the selected activist quarter and may still be filing. First
              50 returned holdings; {String(d?.holdingsCount ?? "unknown")}{" "}
              total rows including exited positions. No complete portfolio is
              implied by this page.
            </p>
          )}
          <IntelligenceTable
            title={
              history ? "Institution filing history" : "Institution holdings"
            }
            rows={institutionRows(d, history)}
          />
          <details>
            <summary>Source & comparison basis</summary>
            <p>
              Source: SentiSense institutional 13F records. Quarter-over-quarter
              changes are shown only for comparable filings. Estimated flow uses
              quarter-end snapshots, not reported cash transactions; changes in
              equity value also include price moves. Retrieved{" "}
              {r.data?.retrievedAt}.
            </p>
          </details>
        </>
      )}
    </div>
  );
}
