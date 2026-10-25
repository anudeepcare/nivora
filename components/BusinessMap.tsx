"use client";
import type { Research } from "@/lib/types";
import { companyClassification } from "@/lib/company-classification";
import { modelCoverage } from "@/lib/research-depth";
export default function BusinessMap({ research: r }: { research: Research }) {
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
      <header className="business-map-title">
        <span>COMPANY CONTEXT</span>
        <h3>The business behind the numbers.</h3>
      </header>
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
    </section>
  );
}
