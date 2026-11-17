"use client";
import Link from "next/link";
import type { Research } from "@/lib/types";
import { amount, dateLabel } from "@/lib/format";
export default function FreeSnapshot({ research: r }: { research: Research }) {
  const revenue = [...r.facts]
    .filter((f) => f.metric === "revenue")
    .sort((a, b) => b.end.localeCompare(a.end))[0];
  return (
    <section className="membership-panel">
      <span className="eyebrow">Company essentials</span>
      <h2>{r.company.name}</h2>
      <p>
        {r.company.description ||
          "Review the company, its current observation and the available reported evidence."}
      </p>
      <div className="membership-metrics">
        <div>
          <span>Observed price</span>
          <strong>{amount(r.quote.price, r.quote.currency)}</strong>
          <small>
            {r.quote.asOf
              ? dateLabel(r.quote.asOf)
              : "Observation time unavailable"}
          </small>
        </div>
        <div>
          <span>Latest supplied revenue</span>
          <strong>
            {revenue
              ? amount(revenue.value, revenue.currency ?? revenue.unit, true)
              : "Not available"}
          </strong>
          <small>
            {revenue
              ? `Period ends ${dateLabel(revenue.end)}`
              : "No reported revenue available"}
          </small>
        </div>
      </div>
      <p>
        Price conditions alone do not establish business quality or investment
        value. Review funding, dilution and business risks before making a
        decision.
      </p>
      {r.issues.length > 0 && (
        <p role="status">
          Some company evidence is unavailable. This is not a clean bill of
          health.
        </p>
      )}
      <Link href="/plans">Explore Pro features →</Link>
    </section>
  );
}
