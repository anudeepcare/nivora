"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { monthlyReadings } from "@/lib/dca-research";
import { compareDca } from "@/lib/planning";
import { amount, percent } from "@/lib/format";
import { downloadCsv } from "./ResearchWorkbench";
export default function DcaResearch({ research: r }: { research: Research }) {
  const [cost, setCost] = useState(10);
  const market = r.company.assetType === "crypto" ? "crypto" : "us-equity";
  const readings = useMemo(
    () => monthlyReadings(r.history, r.retrievedAt, market),
    [r, market],
  );
  const result = useMemo(
    () => compareDca(r.history, r.retrievedAt, cost, market),
    [r, cost, market],
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
      <header className="section-head">
        <div>
          <h3>Equal-budget historical comparison</h3>
          <p>
            Both approaches receive 100 model units each month. Adaptive buying
            uses only the prior confirmed month and available cash.
          </p>
        </div>
        <label className="cost-control">
          Fees + slippage (bps)
          <select
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          >
            <option value={0}>0</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </header>
      {result.months ? (
        <>
          <div className="context-highlights">
            <div>
              <span>Fixed monthly · ending value</span>
              <strong>{amount(result.fixed.value, "USD")}</strong>
              <small>{result.months} eligible months</small>
            </div>
            <div>
              <span>Adaptive · ending value</span>
              <strong>{amount(result.adaptive.value, "USD")}</strong>
              <small>
                Includes {amount(result.adaptive.cash, "USD")} uninvested cash
              </small>
            </div>
            <div>
              <span>Adaptive drawdown</span>
              <strong className="red">
                {percent(result.adaptive.drawdown)}
              </strong>
              <small>
                Monthly observations; intramonth losses can be larger
              </small>
            </div>
          </div>
          <button
            className="text-button"
            onClick={() =>
              downloadCsv(`${r.company.symbol}-dca-comparison.csv`, [
                [
                  "month",
                  "fixed_model_units",
                  "adaptive_model_units",
                  "adaptive_cash",
                  "prior_confirmed_multiplier",
                ],
                ...result.history.map((x) => [
                  x.month,
                  x.fixed,
                  x.adaptive,
                  x.cash,
                  x.multiplier,
                ]),
              ])
            }
          >
            Download comparison
          </button>
        </>
      ) : (
        <p>Not enough subsequent complete months for a comparison.</p>
      )}
      <details>
        <summary>Model rules & limitations</summary>
        <p>
          24 consecutive month-end closes. 2× requires at least 15% drawdown and
          10% below the 24-month average; 3× requires 30% and 20%; 4× requires
          50% and 35%. More than 25% above the average pauses buying. Otherwise
          1×.
        </p>
        {result.limitations.map((x) => (
          <p className="small muted" key={x}>
            {x}
          </p>
        ))}
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
