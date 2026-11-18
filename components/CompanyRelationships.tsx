"use client";
import ProductLookup from "./ProductLookup";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { useState } from "react";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import type { CompanyRelationships as Relationships } from "@/lib/company-relationships";
import s from "./SentiSensePanels.module.css";
export default function CompanyRelationships({
  symbol,
  preview = false,
}: {
  symbol: string;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const resource = useResource<SentiSenseResult>(
    open && !preview
      ? `intelligence/${encodeURIComponent(symbol)}?dataset=relationships`
      : null,
    undefined,
    300000,
  );
  const graph =
    resource.data?.status === "available" &&
    sameProviderSymbol(resource.data.symbol, symbol)
      ? (resource.data.data as Relationships | null)
      : null;
  const names = new Map(graph?.nodes.map((n) => [n.slug, n.displayName]) ?? []);
  if (preview) return null;
  return (
    <section aria-label="Company relationships">
      <ProductLookup key={symbol} companySymbol={symbol} />
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Company relationships {open ? "−" : "+"}
      </button>
      {open && (
        <>
          {resource.loading ? (
            <p role="status">Loading relationships…</p>
          ) : resource.error ? (
            <p role="status">
              Relationships could not load.{" "}
              <button type="button" onClick={resource.refresh}>
                Retry
              </button>
            </p>
          ) : !graph ? (
            <p role="status">
              No verified relationship map is available for {symbol}.
            </p>
          ) : (
            <>
              <div
                className={s.tableRegion}
                tabIndex={0}
                role="region"
                aria-label="Company relationship records"
              >
                <table className={s.table}>
                  <caption className="sr-only">
                    Provider-curated relationships; direction is preserved, not
                    a financial forecast.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">From</th>
                      <th scope="col">Relationship</th>
                      <th scope="col">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graph.edges.map((e, i) => (
                      <tr key={`${e.source}-${e.type}-${e.target}-${i}`}>
                        <td>{names.get(e.source)}</td>
                        <td>
                          {e.type.replaceAll("_", " ").toLowerCase()}
                          {e.direction === "BIDIRECTIONAL" ? " ↔" : " →"}
                        </td>
                        <td>{names.get(e.target)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!graph.edges.length && (
                <p>No relationships returned for this company.</p>
              )}
              {graph.truncated && (
                <p className="small muted">
                  Showing a bounded subset of the relationship map.
                </p>
              )}
              <details data-info-disclosure>
                <summary aria-label="Relationship source details">
                  ⓘ Source
                </summary>
                <p>
                  SentiSense curated company relationships. Retrieved{" "}
                  {resource.data?.retrievedAt.slice(0, 10)}; source observation
                  date not supplied.
                </p>
              </details>
            </>
          )}
        </>
      )}
    </section>
  );
}
