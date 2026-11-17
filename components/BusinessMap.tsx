"use client";
import type { Research } from "@/lib/types";
import { companyClassification } from "@/lib/company-classification";
import { modelCoverage } from "@/lib/research-depth";
export default function BusinessMap({ research: r }: { research: Research }) {
  const profile = r.evidence?.profile;
  const classification = companyClassification({
    symbol: r.company.symbol,
    assetType: r.company.assetType,
    sector: profile?.sector || r.company.sector,
    industry: profile?.industry,
  });
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: profile?.sector || r.company.sector,
    industry: profile?.industry,
  });
  if (r.company.assetType === "crypto") return null;
  return (
    <section className="depth-business" aria-label="Company business context">
      <header className="depth-heading">
        <div>
          <span className="eyebrow">THE BUSINESS</span>
          <h2>How {r.company.name} earns its place.</h2>
        </div>
        <div className="business-classification">
          {[classification.sector, classification.industry]
            .filter(Boolean)
            .map((x) => (
              <span key={x}>{x}</span>
            ))}
        </div>
      </header>
      <div className="business-context-layout">
        <details className="business-profile">
          <summary>
            About {r.company.name}
            <span>Business model & company description</span>
          </summary>
          <p>
            {r.company.description ||
              profile?.description ||
              "Use the company's latest annual report to understand its products, customers and revenue sources."}
          </p>
        </details>
        <section className="business-driver-map">
          <span className="eyebrow">WHAT MATTERS IN THIS BUSINESS</span>
          <div>
            {coverage.drivers.map((driver, i) => (
              <article key={driver}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{driver}</span>
              </article>
            ))}
          </div>
          <p>
            {coverage.method} These are research questions, not verified
            competitive advantages.
          </p>
        </section>
      </div>
    </section>
  );
}
