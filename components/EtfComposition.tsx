"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import IntelligenceTable from "./IntelligenceTable";
import { etfComposition } from "@/lib/etf-composition";
export default function EtfComposition({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [limit, setLimit] = useState(50);
  const resource = useResource<SentiSenseResult>(
    open
      ? `intelligence/${encodeURIComponent(symbol)}?dataset=etfHoldings`
      : null,
    undefined,
    86400000,
  );
  const model = etfComposition(resource.data?.data),
    filtered = model.rows.filter((r) =>
      r.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Fund composition &amp; holding weights</summary>
      {open && (
        <>
          {resource.loading ? (
            <p role="status">Loading reported fund holdings…</p>
          ) : resource.error ? (
            <p role="status">
              Holdings could not be loaded.{" "}
              <button onClick={resource.refresh}>Retry holdings</button>
            </p>
          ) : resource.data?.status !== "available" ? (
            <p role="status">
              Fund composition is unavailable. No stock ownership records are
              substituted.
            </p>
          ) : (
            <>
              <p>
                Composition {model.date ?? "date not supplied"}.{" "}
                {model.partial
                  ? "Partial holdings file, not the complete fund."
                  : "Reported holdings file; weights are not live allocations."}{" "}
                {model.totalKnown !== null
                  ? `${model.totalKnown} total holdings reported by issuer.`
                  : ""}
              </p>
              <label>
                Filter fund holdings
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(50);
                  }}
                />
              </label>
              <p>
                {filtered.length} matching of {model.rows.length} returned
                holdings.
              </p>
              <IntelligenceTable
                title="Fund holdings"
                rows={filtered.slice(0, limit)}
              />
              {filtered.length > limit && (
                <button className="button" onClick={() => setLimit(limit + 50)}>
                  Show 50 more holdings ({Math.min(limit, filtered.length)}{" "}
                  shown)
                </button>
              )}
              <p>
                Only constituents with a verified US listing link open stock
                research. Local exchange symbols are not assumed to identify a
                US company.
              </p>
            </>
          )}
        </>
      )}
    </details>
  );
}
