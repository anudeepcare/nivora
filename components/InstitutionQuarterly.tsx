"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { QuarterlyResult } from "@/lib/institution-quarterly";
import IntelligenceTable from "./IntelligenceTable";
export function QuarterlyData({ view }: { view: "bonds" | "options" }) {
  const [page, setPage] = useState(0);
  const r = useResource<QuarterlyResult>(
    `institution-quarterly?view=${view}`,
    undefined,
    300000,
  );
  const d = r.data;
  if (r.loading)
    return (
      <p role="status">Checking available quarter and reported positions…</p>
    );
  if (r.error || !d)
    return (
      <p role="status">
        Quarterly positions unavailable.{" "}
        <button onClick={r.refresh}>Retry</button>
      </p>
    );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(d.rows.length / 25) - 1),
  );
  const rows = d.rows.slice(current * 25, (current + 1) * 25);
  return (
    <section aria-label="Quarterly institutional positions">
      <h4>
        {view === "bonds"
          ? "Convertible bond positions"
          : "Reported call and put positions"}
      </h4>
      <p>
        Quarter ended {d.reportDate}.{" "}
        {d.isPreview ? "Limited subscription preview. " : ""}
        {d.rows.length} usable rows from {d.returnedCount} returned; {d.omitted}{" "}
        invalid or duplicate rows omitted.
      </p>
      <p>
        Quarterly 13F disclosures, not live trades, contract volume or a
        buy/sell signal. Position values are reported exposure, not option
        premiums. Hedges and short positions are not resolved here.
      </p>
      <IntelligenceTable
        title={
          view === "bonds"
            ? "Convertible bonds by underlying"
            : "Options by underlying"
        }
        rows={rows.map((x) => ({
          label: x.ticker,
          date: d.reportDate,
          href: null,
          cells: [
            { label: "Company", value: x.companyName || "Not supplied" },
            ...x.metrics.map((m) => ({
              label: m.label,
              value:
                m.value === null
                  ? "Not supplied"
                  : m.value.toLocaleString("en-US"),
            })),
            ...(x.notation
              ? [{ label: "Reported bond notation", value: x.notation }]
              : []),
          ],
        }))}
      />
      {!d.rows.length && (
        <p>
          No usable positions returned for this quarter. This is not proof of no
          market-wide exposure.
        </p>
      )}
      {!d.isPreview && d.rows.length > 25 && (
        <nav aria-label="Returned quarterly rows">
          <button
            className="btn"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous rows
          </button>
          <span>
            {" "}
            Page {current + 1} of {Math.ceil(d.rows.length / 25)}{" "}
          </span>
          <button
            className="btn"
            disabled={(current + 1) * 25 >= d.rows.length}
            onClick={() => setPage(current + 1)}
          >
            Next rows
          </button>
        </nav>
      )}
      <details>
        <summary>Source and coverage</summary>
        <p>
          SentiSense SEC 13F records. The latest non-pending quarter actually
          returned by the source is selected. The dataset does not echo its
          quarter; the displayed date is the validated request date. Source
          pages are not supported: these controls page only the returned
          dataset, not an exhaustive ownership census. Retrieved {d.retrievedAt}
          . Loaded results may be older. Reported share/unit changes are
          quarterly differences, not cash flows or contract counts; no
          directional interpretation is inferred.
        </p>
      </details>
    </section>
  );
}
export default function InstitutionQuarterly() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"bonds" | "options">("bonds");
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Quarterly bonds and options · reported positions</summary>
      {open && (
        <>
          <div role="group" aria-label="Quarterly position type">
            <button
              className="btn"
              aria-pressed={view === "bonds"}
              onClick={() => setView("bonds")}
            >
              Convertible bonds
            </button>
            <button
              className="btn"
              aria-pressed={view === "options"}
              onClick={() => setView("options")}
            >
              Call / put positions
            </button>
          </div>
          <QuarterlyData key={view} view={view} />
        </>
      )}
    </details>
  );
}
