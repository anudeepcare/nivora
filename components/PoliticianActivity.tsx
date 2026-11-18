"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { ActivityResult } from "@/lib/politician-activity";
import IntelligenceTable from "./IntelligenceTable";
export function ActivityPage({ days }: { days: number }) {
  const [offset, setOffset] = useState(0);
  const r = useResource<ActivityResult>(
    `politician-activity?days=${days}&offset=${offset}`,
    undefined,
    300000,
  );
  const d = r.data;
  if (r.loading)
    return <p role="status">Loading recent congressional disclosures…</p>;
  if (r.error || !d)
    return (
      <p role="status">
        Activity unavailable. <button onClick={r.refresh}>Retry</button>
        {offset > 0 && (
          <button onClick={() => setOffset(0)}>Return to first page</button>
        )}
      </p>
    );
  return (
    <section aria-label="Market-wide congressional activity">
      <h4>Recent disclosures across tracked members</h4>
      <p>
        Requested disclosure window: {d.windowStart} to {d.windowEnd}.
        Transactions may be older.{" "}
        {d.isPreview ? "Limited subscription preview. " : ""}
        {d.rows.length} usable rows from {d.returnedCount} returned at offset{" "}
        {d.offset}; {d.totalCount ?? "unknown"} records in the provider window.{" "}
        {d.omitted} invalid or out-of-window rows omitted.
      </p>
      <p>
        Disclosed USD ranges, not exact amounts or portfolio balances. Owner and
        asset type are reported fields. These records do not establish motive,
        wrongdoing or future performance.
      </p>
      <IntelligenceTable
        title="Market-wide disclosures"
        dateHeading="Disclosure / fallback date"
        rows={d.rows.map((t) => ({
          label: `${t.name} · ${t.ticker || "Asset not supplied"}`,
          date: t.sortDate,
          href: null,
          cells: [
            {
              label: "Disclosure date",
              value: t.disclosureDate || "Not supplied",
            },
            {
              label: "Transaction date",
              value: t.transactionDate || "Not supplied",
            },
            { label: "Date basis", value: t.dateBasis },
            {
              label: "Reported chamber / state",
              value: `${t.chamber} / ${t.state || "Not supplied"}`,
            },
            { label: "Bioguide identity", value: t.bioguideId },
            { label: "Transaction", value: t.transactionType },
            { label: "Reported owner", value: t.owner },
            { label: "Asset type", value: t.assetType },
            {
              label: "Asset description",
              value: t.assetDescription || "Not supplied",
            },
            { label: "Disclosed range (USD)", value: t.amountRange },
            {
              label: "Lower / upper reported bounds (USD)",
              value: `${t.amountMin === null ? "Not supplied" : t.amountMin.toLocaleString("en-US")} / ${t.amountMax === null ? "Not supplied or open-ended" : t.amountMax.toLocaleString("en-US")}`,
            },
            ...(t.option
              ? [
                  {
                    label: "Filed option detail",
                    value: `${t.option.optionType} · strike ${t.option.strikePrice} · expires ${t.option.expirationDate}`,
                  },
                ]
              : []),
          ],
        }))}
      />
      {!d.rows.length && (
        <p>
          No usable records returned for this page. This does not establish that
          no transactions occurred.
        </p>
      )}
      {!d.isPreview && (
        <nav aria-label="Activity pages">
          <button
            className="btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            Previous activity
          </button>
          <button
            className="btn"
            disabled={!d.canNext}
            onClick={() => setOffset(offset + 50)}
          >
            Next activity
          </button>
        </nav>
      )}
      {offset === 1000 && (
        <p>Interactive paging limit reached; choose a narrower window.</p>
      )}
      <details>
        <summary>Source and date limitations</summary>
        <p>
          SentiSense congressional disclosures; this view is market-wide, not
          limited to the research ticker. Provider order is retained: disclosure
          date first, transaction date fallback when disclosure is absent. A
          fallback is explicitly labeled, never presented as a filing date.
          Stock, ETF and stock-option coverage is not a complete asset or
          officeholder census. No performance or sentiment score is inferred.
          Retrieved {d.retrievedAt}; loaded results can be older. New filings
          and corrections can shift page boundaries. Existing official filing
          links in the ticker evidence remain unchanged.
        </p>
      </details>
    </section>
  );
}
export default function PoliticianActivity() {
  const [open, setOpen] = useState(false),
    [days, setDays] = useState(90);
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Market-wide congressional disclosures</summary>
      {open && (
        <>
          <label>
            Disclosure lookback
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>365 days</option>
            </select>
          </label>
          <ActivityPage key={days} days={days} />
        </>
      )}
    </details>
  );
}
