"use client";
import { useMemo, useState } from "react";
import type { Position, Quote } from "@/lib/types";
import { portfolioChartData } from "@/lib/portfolio-ledger";
import { amount, percent } from "@/lib/format";
export default function PortfolioCharts({
  positions,
  quotes,
}: {
  positions: Position[];
  quotes: Record<string, Quote>;
}) {
  const [view, setView] = useState<"allocation" | "returns">("allocation"),
    data = useMemo(
      () => portfolioChartData(positions, quotes),
      [positions, quotes],
    );
  const allocations = data.allocations.slice(0, 5),
    other = data.allocations.slice(5).reduce((s, r) => s + r.value, 0),
    mix =
      other > 0
        ? [
            ...allocations,
            {
              symbol: "Other",
              value: other,
              weight: data.total > 0 ? (other / data.total) * 100 : 0,
            },
          ]
        : allocations;
  const movers = data.returns.slice(0, 6),
    scale = Math.max(1, ...movers.map((r) => Math.abs(r.pnl)));
  return (
    <section className="portfolio-charts" aria-label="Portfolio charts">
      <header>
        <div>
          <span className="eyebrow">Your money, in perspective</span>
          <h3>
            {view === "allocation"
              ? "Where your money sits"
              : "What drives your gain or loss"}
          </h3>
        </div>
        <div className="segments" role="group" aria-label="Portfolio chart">
          {(["allocation", "returns"] as const).map((v) => (
            <button
              type="button"
              key={v}
              aria-pressed={view === v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v === "allocation" ? "Allocation" : "Gain / loss"}
            </button>
          ))}
        </div>
      </header>
      {view === "allocation" ? (
        mix.length ? (
          <figure>
            <div
              className="portfolio-mix-track"
              role="img"
              aria-label={mix
                .map((r) => `${r.symbol}: ${percent(r.weight)}`)
                .join("; ")}
            >
              {mix.map((r, i) => (
                <span
                  key={r.symbol}
                  style={{
                    width: `${r.weight}%`,
                    background: `var(--mix-${i})`,
                  }}
                  title={`${r.symbol} · ${percent(r.weight)}`}
                />
              ))}
            </div>
            <figcaption className="portfolio-mix-legend">
              {mix.map((r, i) => (
                <div key={r.symbol}>
                  <i style={{ background: `var(--mix-${i})` }} />
                  <b>{r.symbol}</b>
                  <span>{amount(r.value, "USD", true)}</span>
                  <strong>{percent(r.weight)}</strong>
                </div>
              ))}
            </figcaption>
          </figure>
        ) : (
          <p className="ledger-empty">
            Usable USD prices are needed to display allocation.
          </p>
        )
      ) : movers.length ? (
        <figure className="portfolio-return-bars">
          <figcaption>
            Largest absolute unrealized changes · recorded cost to current price
          </figcaption>
          {movers.map((r) => (
            <div className="portfolio-return-row" key={r.symbol}>
              <b>{r.symbol}</b>
              <div
                className="portfolio-return-axis"
                role="img"
                aria-label={`${r.symbol}: ${amount(r.pnl, "USD")} unrealized`}
              >
                <span
                  className={r.pnl < 0 ? "loss" : "gain"}
                  style={{
                    width: `${(Math.abs(r.pnl) / scale) * 50}%`,
                    left: `${r.pnl < 0 ? 50 - (Math.abs(r.pnl) / scale) * 50 : 50}%`,
                  }}
                />
              </div>
              <strong className={r.pnl < 0 ? "negative" : "positive"}>
                {amount(r.pnl, "USD", true)}
              </strong>
            </div>
          ))}
        </figure>
      ) : (
        <p className="ledger-empty">
          Usable prices and recorded USD costs are needed for this chart.
        </p>
      )}
      <p className="portfolio-chart-note">
        {view === "allocation"
          ? "Priced USD assets and recorded cash. Duplicate tickers are combined."
          : "Unrealized changes, not daily performance or total returns. Cash and unknown-cost positions are excluded."}
        {data.excluded.length
          ? ` ${data.excluded.length} unpriced instruments excluded.`
          : ""}
      </p>
    </section>
  );
}
