"use client";
import InstitutionDetail from "./InstitutionDetail";
import InstitutionFinder from "./InstitutionFinder";
import InstitutionQuarterly from "./InstitutionQuarterly";
import { useState } from "react";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import IntelligenceTable from "./IntelligenceTable";
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("en-US")
    : "Not supplied";
export default function InstitutionalActivists() {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState("");
  const r = useResource<SentiSenseResult>(
    open ? "institutional-activists" : null,
    undefined,
    900000,
  );
  const rows = Array.isArray(r.data?.data)
    ? (r.data.data as Record<string, unknown>[])
    : [];
  return (
    <>
      <InstitutionFinder />
      <InstitutionQuarterly />
      <details onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>Activist positions · latest completed filing quarter</summary>
        {open && (
          <>
            <p>
              New or increased reported positions, not proof of a campaign or a
              trade recommendation. The latest non-pending filing quarter is
              selected from the source’s available quarters.
            </p>
            {r.loading ? (
              <p role="status">Checking filing quarter and positions…</p>
            ) : r.error ||
              !["available", "preview"].includes(r.data?.status ?? "") ? (
              <p role="status">
                Completed-quarter coverage unavailable.{" "}
                <button onClick={r.refresh}>Retry activist positions</button>
              </p>
            ) : (
              <>
                <p>
                  Quarter ended {r.data?.asOf ?? "not supplied"}.{" "}
                  {r.data?.isPreview ? "Limited subscription preview. " : ""}
                  {rows.length} shown of {r.data?.totalCount ?? rows.length}{" "}
                  returned positions. This does not certify every institution
                  filed.
                </p>
                <label>
                  Inspect a reported institution{" "}
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">Choose an institution</option>
                    {[
                      ...new Map(
                        rows
                          .filter(
                            (x) =>
                              typeof x.filerCik === "string" &&
                              /^\d{1,10}$/.test(x.filerCik),
                          )
                          .map((x) => [String(x.filerCik), x]),
                      ).values(),
                    ].map((x) => (
                      <option
                        key={String(x.filerCik)}
                        value={String(x.filerCik)}
                      >
                        {String(x.filerName)}
                      </option>
                    ))}
                  </select>
                </label>
                {selected && (
                  <InstitutionDetail key={selected} cik={selected} />
                )}
                {!selected && (
                  <IntelligenceTable
                    title="Activist positions"
                    rows={rows.map((x) => ({
                      label: String(x.filerName),
                      date:
                        typeof x.filedDate === "string" ? x.filedDate : null,
                      href: null,
                      cells: [
                        {
                          label: "Company",
                          value: String(x.companyName ?? x.ticker),
                        },
                        { label: "Ticker", value: String(x.ticker) },
                        {
                          label: "Change",
                          value:
                            x.changeType === "NEW"
                              ? "New position"
                              : "Increased position",
                        },
                        { label: "Shares held", value: num(x.shares) },
                        {
                          label: "Reported value (USD)",
                          value: num(x.valueUsd),
                        },
                        { label: "Shares added", value: num(x.sharesChange) },
                        {
                          label: "Change %",
                          value:
                            x.changeType === "NEW"
                              ? "New position · no prior basis"
                              : typeof x.sharesChangePct === "number"
                                ? `${num(x.sharesChangePct)}%`
                                : "Not supplied",
                        },
                      ],
                    }))}
                  />
                )}
                {!rows.length && (
                  <p>No qualifying positions returned for this quarter.</p>
                )}
                <details>
                  <summary>Source and dates</summary>
                  <p>
                    Source: SentiSense institutional 13F filings. Table dates
                    are filing dates; the quarter end is the holdings
                    observation date. Retrieved {r.data?.retrievedAt}. The first
                    fifty returned positions are displayed; this is not a
                    market-wide ownership census.
                  </p>
                </details>
              </>
            )}
          </>
        )}
      </details>
    </>
  );
}
