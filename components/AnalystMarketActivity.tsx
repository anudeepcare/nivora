"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { AnalystActivityResult } from "@/lib/analyst-market-activity";
import IntelligenceTable from "./IntelligenceTable";
export function AnalystActivityPage({
  days,
  mode,
}: {
  days: number;
  mode: "changes" | "all";
}) {
  const [offset, setOffset] = useState(0);
  const r = useResource<AnalystActivityResult>(
    `analyst-market-activity?days=${days}&mode=${mode}&offset=${offset}`,
    undefined,
    300000,
  );
  const d = r.data;
  if (r.loading)
    return <p role="status">Loading published market-wide analyst actions…</p>;
  if (r.error || !d)
    return (
      <p role="status">
        This page is unavailable or access is limited.{" "}
        <button onClick={r.refresh}>Retry</button>
        {offset > 0 && (
          <button onClick={() => setOffset(0)}>Return to first page</button>
        )}
      </p>
    );
  return (
    <section aria-label="Market-wide analyst actions">
      <h4>
        {mode === "changes"
          ? "Rating changes and coverage initiations"
          : "All published analyst actions"}
      </h4>
      <p>
        Market-wide, not limited to the research ticker. Requested action-date
        window {d.windowStart} to {d.windowEnd}.{" "}
        {d.isPreview ? "Limited provider preview. " : ""}
        {d.rows.length} usable rows from {d.returnedCount} returned at offset{" "}
        {d.offset}; {d.totalCount} records in the provider’s filtered window.{" "}
        {d.omitted} invalid, out-of-window or filter-mismatched rows omitted.
      </p>
      <IntelligenceTable
        title="Published analyst actions"
        dateHeading="Action date"
        rows={d.rows.map((x) => ({
          label: `${x.ticker} · ${x.firm}`,
          date: x.actionDate,
          href: `/research/${encodeURIComponent(x.ticker)}`,
          cells: [
            { label: "Action", value: x.actionType },
            { label: "Previous rating", value: x.fromGrade || "Not supplied" },
            { label: "Published rating", value: x.toGrade || "Not supplied" },
          ],
        }))}
      />
      {!d.rows.length && (
        <p>
          No usable actions returned for this page. This is not evidence that
          the wider market has no analyst coverage.
        </p>
      )}
      {!d.isPreview && (
        <nav aria-label="Market analyst pages">
          <button
            className="btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            Previous actions
          </button>
          <button
            className="btn"
            disabled={!d.canNext}
            onClick={() => setOffset(offset + 50)}
          >
            Next actions
          </button>
        </nav>
      )}
      {offset === 1000 && (
        <p>Interactive paging limit reached; choose a shorter window.</p>
      )}
      <details>
        <summary>Coverage, targets and access</summary>
        <p>
          The provider’s first 50 rows can be full on a free key; that does not
          establish paid access to later pages. A later-page preview is withheld
          rather than relabeled as another page. New records can shift page
          boundaries. Source order is retained; rating terms are attributed to
          the publishing firm, not an app recommendation or a reconstruction of
          the consensus panel. Reiterations confirm a rating and need not
          represent a change.
        </p>
        <p>
          Market-wide target values are intentionally not compared here because
          this endpoint does not apply the per-ticker split checks. Open the
          ticker research for its dated analyst evidence. The app validates
          date-only records against a New York calendar-day boundary; provider
          timezone is not specified. Source: SentiSense. Retrieved{" "}
          {d.retrievedAt}; loaded results can be older.
        </p>
      </details>
    </section>
  );
}
export default function AnalystMarketActivity() {
  const [open, setOpen] = useState(false),
    [days, setDays] = useState(30),
    [mode, setMode] = useState<"changes" | "all">("changes");
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Across the market · published rating actions</summary>
      {open && (
        <>
          <label>
            Action window
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <label>
            Action types
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "changes" | "all")}
            >
              <option value="changes">
                Upgrades, downgrades and initiations
              </option>
              <option value="all">All, including reiterations</option>
            </select>
          </label>
          <AnalystActivityPage
            key={`${days}:${mode}`}
            days={days}
            mode={mode}
          />
        </>
      )}
    </details>
  );
}
