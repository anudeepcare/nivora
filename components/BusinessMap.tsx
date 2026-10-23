"use client";
import { useState } from "react";
import type { Research } from "@/lib/types";
import type { SegmentRow } from "@/lib/market-context";
import { companyClassification } from "@/lib/company-classification";
import { modelCoverage } from "@/lib/research-depth";
import { amount, dateLabel } from "@/lib/format";
import { useProduct, useResource } from "./Session";
export default function BusinessMap({ research: r }: { research: Research }) {
  const { demo } = useProduct(),
    [segmentsEnabled, setSegmentsEnabled] = useState(false),
    [axis, setAxis] = useState("ProductOrService");
  const path = encodeURIComponent(r.company.symbol.replace("/", "-"));
  const segments = useResource<{
    rows: SegmentRow[];
    conflicts: number;
    observedAt: string;
  }>(
    !demo && segmentsEnabled ? `research-context/${path}?kind=segments` : null,
    undefined,
    86400000,
  );
  const available = segments.data?.rows.filter((x) => x.axis === axis) ?? [],
    period = available
      .map((x) => x.period)
      .sort()
      .at(-1),
    current = available.filter((x) => x.period === period),
    concepts = [...new Set(current.map((x) => x.concept))],
    unitSet = [...new Set(current.map((x) => x.unit))];
  const profile = r.evidence?.profile,
    classification = companyClassification({
      symbol: r.company.symbol,
      assetType: r.company.assetType,
      sector: profile?.sector || r.company.sector,
      industry: profile?.industry,
    }),
    coverage = modelCoverage(r.company.symbol, r.company.assetType, {
      sector: profile?.sector || r.company.sector,
      industry: profile?.industry,
    });
  if (r.company.assetType === "crypto") return null;
  return (
    <section className="business-map business-map-compact">
      <details className="company-profile">
        <summary>About {r.company.name}</summary>
        {(classification.sector || classification.industry) && (
          <p className="small muted">
            {[classification.sector, classification.industry]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p>
          {r.company.description ||
            profile?.description ||
            "Read the latest company filing for the business description."}
        </p>
        <h4>Questions for this business</h4>
        <ul className="business-checklist">
          {coverage.drivers.map((driver) => (
            <li key={driver}>{driver}</li>
          ))}
        </ul>
        <p className="small muted">
          {coverage.method} These are questions to investigate, not established
          company strengths.
        </p>
      </details>
      <details
        className="segment-breakdown"
        onToggle={(event) => {
          if (event.currentTarget.open) setSegmentsEnabled(true);
        }}
      >
        <summary>Revenue by business &amp; region</summary>
        <div className="market-context-actions">
          <button
            className="button"
            disabled={segments.loading || !!demo}
            onClick={() =>
              segmentsEnabled ? segments.refresh() : setSegmentsEnabled(true)
            }
          >
            {segments.loading
              ? "Loading disclosures…"
              : "Refresh revenue breakdown"}
          </button>
          <label>
            Dimension
            <select value={axis} onChange={(e) => setAxis(e.target.value)}>
              <option value="ProductOrService">Product / service</option>
              <option value="Geographic">Geographic</option>
            </select>
          </label>
        </div>
        {segments.error && (
          <p role="status">
            {segments.error} Other company financials remain available.
          </p>
        )}
        {segments.data && (
          <>
            {current.length > 0 && (
              <p className="small muted">
                Period {dateLabel(period)} · checked{" "}
                {dateLabel(segments.data.observedAt)}
                {segments.data.conflicts
                  ? ` · ${segments.data.conflicts} conflicting groups withheld`
                  : ""}
              </p>
            )}
            {current.length ? (
              <div className="table-scroll">
                <table>
                  <caption>
                    As-disclosed segment amounts · {unitSet.join(", ")} ·{" "}
                    {concepts.length} revenue concepts
                  </caption>
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th>Reported amount</th>
                      <th>Concept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.map((x) => (
                      <tr key={JSON.stringify(x)}>
                        <td>{x.member}</td>
                        <td>{amount(x.value, x.unit, true)}</td>
                        <td>{x.concept}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Revenue breakdown unavailable for this dimension.</p>
            )}
            {current.length > 0 && (
              <details>
                <summary>About these disclosures</summary>
                <p>
                  Product and geographic dimensions can overlap. Period starts
                  and original passages are not supplied; revenue shares and mix
                  growth are not inferred.
                </p>
              </details>
            )}
          </>
        )}
      </details>
    </section>
  );
}
