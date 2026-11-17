"use client";
import InstitutionalActivists from "./InstitutionalActivists";
import { useState } from "react";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import IntelligenceTable from "./IntelligenceTable";
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("en-US")
    : "Not supplied";
export default function InstitutionalFlows() {
  const [open, setOpen] = useState(false),
    [direction, setDirection] = useState<"inflows" | "outflows">("inflows");
  const resource = useResource<SentiSenseResult>(
    open ? "institutional-flows" : null,
    undefined,
    900000,
  );
  const data = resource.data?.data as {
    reportDate: string;
    isPending: boolean;
    filerCount: number | null;
    baselineFilerCount: number | null;
    inflows: Record<string, unknown>[];
    outflows: Record<string, unknown>[];
  } | null;
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Institutional position changes across the market</summary>
      {open && (
        <>
          <p>
            Reported quarter-over-quarter share changes among comparable filing
            families. Not daily cash flows or a conviction score.
          </p>
          {resource.loading ? (
            <p role="status">Loading reported position changes…</p>
          ) : resource.error ||
            !["available", "preview"].includes(resource.data?.status ?? "") ? (
            <p role="status">
              Institutional coverage unavailable.{" "}
              <button onClick={resource.refresh}>Retry position changes</button>
            </p>
          ) : (
            data && (
              <>
                <p>
                  Quarter ended {data.reportDate}.{" "}
                  {data.isPending
                    ? `Pending filings: ${number(data.filerCount)} filers represented of ${number(data.baselineFilerCount)} expected.`
                    : "Reported quarter; not a certification that every institution filed."}{" "}
                  {resource.data?.isPreview
                    ? "Limited subscription preview."
                    : ""}
                </p>
                <div
                  role="group"
                  aria-label="Institutional share change direction"
                >
                  {(["inflows", "outflows"] as const).map((id) => (
                    <button
                      key={id}
                      className="btn"
                      aria-pressed={id === direction}
                      onClick={() => setDirection(id)}
                    >
                      {id === "inflows"
                        ? "Net shares added"
                        : "Net shares reduced"}
                    </button>
                  ))}
                </div>
                <IntelligenceTable
                  title="Institutional share changes"
                  rows={data[direction].slice(0, 20).map((r) => ({
                    href: null,
                    label: String(r.companyName ?? r.ticker),
                    date: data.reportDate,
                    cells: [
                      { label: "Ticker", value: String(r.ticker) },
                      { label: "Net shares", value: number(r.netSharesChange) },
                      { label: "New positions", value: number(r.newPositions) },
                      {
                        label: "Closed positions",
                        value: number(r.soldOutPositions),
                      },
                    ],
                  }))}
                />
                {!data[direction].length && (
                  <p>No reported rows in this direction.</p>
                )}
                <details>
                  <summary>Data source & coverage</summary>
                  <p>
                    Source: SentiSense institutional 13F aggregates. Up to
                    twenty returned stocks per direction, not all holdings or
                    market activity. Retrieved {resource.data?.retrievedAt}.
                    Filing comparisons exclude families without a sound
                    prior-quarter comparison.
                  </p>
                </details>
              </>
            )
          )}
          <InstitutionalActivists />
        </>
      )}
    </details>
  );
}
