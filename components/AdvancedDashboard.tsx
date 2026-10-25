"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { advancedDesk, type DeskMetric } from "@/lib/research-desks";
import { amount, percent, dateLabel } from "@/lib/format";
export default function AdvancedDashboard({
  research: r,
}: {
  research: Research;
}) {
  const d = useMemo(() => advancedDesk(r), [r]);
  if (d.count < 2)
    return (
      <section className="advanced-desk-empty">
        <h3>More completed price history is needed.</h3>
        <p>
          Risk charts and distributions are calculated from observed returns.
          Missing data is not filled with assumptions.
        </p>
      </section>
    );
  const floor = Math.min(-1, ...d.drawdown.map((p) => p.value)),
    n = d.drawdown.length;
  const points = d.drawdown
    .map(
      (p, i) =>
        `${((i / Math.max(1, n - 1)) * 1000).toFixed(1)},${(15 + (p.value / floor) * 150).toFixed(1)}`,
    )
    .join(" ");
  const highest = Math.max(1, ...d.distribution.map((b) => b.count));
  const volMax = Math.max(
    1,
    ...d.volatility.flatMap((v) => (v.value == null ? [] : [v.value])),
  );
  const display = (m: DeskMetric) =>
    m.value == null
      ? "History needed"
      : m.unit === "money"
        ? amount(m.value, r.quote.currency, true)
        : m.unit === "sessions"
          ? Math.round(m.value).toLocaleString()
          : percent(m.value);
  return (
    <section
      className="advanced-dashboard depth-risk"
      aria-label="Advanced price and risk workbench"
    >
      <div className="desk-key-metrics">
        {d.metrics.slice(0, 4).map((m) => (
          <article key={m.key}>
            <span>{m.label}</span>
            <strong>{display(m)}</strong>
            <small>{m.note}</small>
          </article>
        ))}
      </div>
      <div className="advanced-chart-grid">
        <section className="drawdown-chart">
          <header>
            <div>
              <span className="eyebrow">Downside perspective</span>
              <h3>The distance back.</h3>
            </div>
            <strong>{percent(d.currentDrawdown)}</strong>
          </header>
          <p>
            Below the highest supplied closing price. The curve shows the last{" "}
            {n} observations; earlier peaks still count.
          </p>
          <svg
            viewBox="0 0 1000 185"
            role="img"
            aria-label="Historical drawdown from the running closing peak"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              x2="1000"
              y1="15"
              y2="15"
              stroke="currentColor"
              opacity=".15"
            />
            <polygon
              points={`0,15 ${points} 1000,15`}
              fill="currentColor"
              opacity=".12"
            />
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <footer>
            <span>{dateLabel(d.drawdown[0]?.date)}</span>
            <span>{dateLabel(d.asOf)}</span>
          </footer>
        </section>
        <section className="return-distribution">
          <header>
            <span className="eyebrow">Return distribution</span>
            <h3>How the days actually traded.</h3>
            <p>
              {d.returnCount.toLocaleString()} observed close-to-close returns;
              not a forecast.
            </p>
          </header>
          <div className="return-buckets">
            {d.distribution.map((b) => (
              <div key={b.label} data-negative={b.negative}>
                <span>{b.label}</span>
                <i>
                  <b style={{ width: `${(b.count / highest) * 100}%` }} />
                </i>
                <strong>
                  {((b.count / Math.max(1, d.returnCount)) * 100).toFixed(1)}%
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="advanced-measurements">
        <header className="section-head">
          <div>
            <span className="eyebrow">Execution & recovery</span>
            <h3>Know the conditions around the trade.</h3>
          </div>
          <small>Completed prices · {dateLabel(d.asOf)}</small>
        </header>
        <div className="desk-secondary-metrics">
          {d.metrics.slice(4).map((m) => (
            <article key={m.key}>
              <span>{m.label}</span>
              <strong>{display(m)}</strong>
              <small>{m.note}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="volatility-comparison">
        <div>
          <span className="eyebrow">Volatility regime</span>
          <h3>Recent noise versus the longer view.</h3>
          <p>
            Annualized sample volatility. These windows overlap and do not
            predict future volatility.
          </p>
        </div>
        <div>
          {d.volatility.map((v) => (
            <article key={v.label}>
              <span>{v.label}</span>
              <strong>{percent(v.value)}</strong>
              <i>
                <b
                  style={{
                    width: `${v.value == null ? 0 : (v.value / volMax) * 100}%`,
                  }}
                />
              </i>
            </article>
          ))}
        </div>
      </section>
      <p className="desk-footnote">
        Historical losses can be exceeded. Volume quality, splits and available
        history affect these measurements. Use Trade plan to test explicit
        sizing and slippage assumptions; no order is placed here.
      </p>
    </section>
  );
}
