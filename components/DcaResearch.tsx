"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { monthlyReadings } from "@/lib/dca-research";
export default function DcaResearch({ research: r }: { research: Research }) {
  const market = r.company.assetType === "crypto" ? "crypto" : "us-equity";
  const readings = useMemo(
    () => monthlyReadings(r.history, r.retrievedAt, market),
    [r, market],
  );
  if (!readings.length) return null;
  return (
    <section className="dca-research">
      <header className="section-head">
        <div>
          <span className="eyebrow">Original monthly price model</span>
          <h3>See the discipline over time</h3>
          <p>
            Confirmed month-end readings and the strongest settled daily reading
            within each month.
          </p>
        </div>
      </header>
      <div className="monthly-readings">
        {readings.map((x) => (
          <div key={x.month}>
            <span>{x.month}</span>
            <b>{x.confirmed}×</b>
            {x.strongest > x.confirmed ? (
              <small title={x.date}>◇ {x.strongest}× during month</small>
            ) : (
              <small>Same strongest zone</small>
            )}
          </div>
        ))}
      </div>
      <p className="small muted">
        Hollow markers show stronger daily-close readings, not intraday lows or
        guaranteed fills. They do not rewrite the confirmed month. Multipliers
        are contribution multiples, not leverage or return forecasts.
      </p>
      <details>
        <summary>Model rules & limitations</summary>
        <p>
          24 consecutive month-end closes. 2× requires at least 15% drawdown and
          10% below the 24-month average; 3× requires 30% and 20%; 4× requires
          50% and 35%. More than 25% above the average pauses buying. Otherwise
          1×.
        </p>
        <p className="small muted">
          Model units are illustrative, not account money. No dividends, taxes
          or interest on cash; no demonstrated advantage or competitor
          equivalence. Business quality, valuation and your allocation are
          separate decisions.
        </p>
      </details>
    </section>
  );
}
