"use client";
import type { Research } from "@/lib/types";
import { researchCoverage } from "@/lib/research-workbench";
import { dateLabel } from "@/lib/format";
export default function ResearchCoverage({
  research: r,
}: {
  research: Research;
}) {
  return (
    <details className="research-coverage">
      <summary>Data availability</summary>
      <div className="dataset-coverage-grid">
        {researchCoverage(r).map((row) => (
          <div key={row.key}>
            <b>{row.label}</b>
            <span className={row.state === "Returned" ? "green" : "muted"}>
              {row.state}
              {row.count > 1 ? ` · ${row.count}` : ""}
            </span>
            <small>
              {row.date ? dateLabel(row.date) : "No observation date"}
            </small>
          </div>
        ))}
      </div>
      <p className="small muted">
        Missing records may mean no activity or unavailable data. Prices,
        filings and estimates update at different times. Incompatible currencies
        are not combined.
      </p>
    </details>
  );
}
