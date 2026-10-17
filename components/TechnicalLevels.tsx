"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { fibOverlay, trendMarkers } from "@/lib/technical-depth";
import { weeklyStudies } from "@/lib/research-depth";
import { amount, dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import { PriceChart } from "./Charts";
export default function TechnicalLevels({
  research: r,
}: {
  research: Research;
}) {
  const [custom, setCustom] = useState(true),
    [manual, setManual] = useState(false),
    [lowValue, setLowValue] = useState(""),
    [highValue, setHighValue] = useState("");
  const bars = useMemo(
      () =>
        r.history
          .filter(
            (b) => b.time.length === 10 && b.time < r.retrievedAt.slice(0, 10),
          )
          .slice(-126),
      [r],
    ),
    lowBar = bars.reduce(
      (a, b) => (!a || b.low < a.low ? b : a),
      undefined as (typeof bars)[number] | undefined,
    ),
    highBar = bars.reduce(
      (a, b) => (!a || b.high > a.high ? b : a),
      undefined as (typeof bars)[number] | undefined,
    ),
    low = manual ? Number(lowValue) : (lowBar?.low ?? 0),
    high = manual ? Number(highValue) : (highBar?.high ?? 0),
    levels = useMemo(() => fibOverlay(low, high, custom), [low, high, custom]),
    lines = useMemo(
      () =>
        levels
          .filter((x) =>
            [0.5, 0.618, ...(custom ? [0.686] : []), 0.786].includes(x.ratio),
          )
          .map((x) => ({ label: `${x.ratio}`, price: x.price })),
      [levels, custom],
    ),
    weekly = weeklyStudies(r.history, r.retrievedAt),
    markers = useMemo(
      () => trendMarkers(r.history, r.retrievedAt).slice(-4),
      [r],
    );
  return (
    <section className="panel technical-levels">
      <header className="section-heading">
        <div>
          <h2>Reference levels</h2>
          <p>
            {manual
              ? "Personal overlay · does not change the canonical research"
              : "Automatic range · last 126 completed daily sessions"}
          </p>
        </div>
        <Help label="Reference levels">
          Retracements run downward from the range high. Extensions project
          upward from the low. The high and low are reproducible range extremes,
          not a future-confirmed swing. Confluence means proximity, not
          confirmed support.
        </Help>
      </header>
      <div className="analyst-controls">
        <label className="check-label">
          <input
            type="checkbox"
            checked={custom}
            onChange={(e) => setCustom(e.target.checked)}
          />
          Show custom 0.686
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          Use my price anchors
        </label>
      </div>
      {manual ? (
        <div className="two-col">
          <label>
            Low price
            <input
              type="number"
              min="0.01"
              step="any"
              value={lowValue}
              onChange={(e) => setLowValue(e.target.value)}
            />
          </label>
          <label>
            High price
            <input
              type="number"
              min="0.01"
              step="any"
              value={highValue}
              onChange={(e) => setHighValue(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <p className="source-line">
          Low {amount(low, r.quote.currency)} · {dateLabel(lowBar?.time)} / High{" "}
          {amount(high, r.quote.currency)} · {dateLabel(highBar?.time)}
        </p>
      )}
      <div className="technical-layout">
        <PriceChart bars={bars} range="126 sessions" levels={lines} />
        <div className="level-grid reference-grid">
          {levels
            .filter((x) => x.ratio !== 0 && x.ratio !== 1)
            .map((x) => (
              <div key={x.ratio}>
                <span>
                  {x.ratio} {x.ratio > 1 ? "extension" : "Fib"}
                </span>
                <strong>{amount(x.price, r.quote.currency)}</strong>
                <small>
                  {x.kind}
                  {[weekly.ma50, weekly.ma200].some(
                    (v) => v != null && Math.abs(v / x.price - 1) <= 0.02,
                  )
                    ? " · near weekly average"
                    : ""}
                </small>
              </div>
            ))}
        </div>
      </div>
      {!levels.length && <p>Choose a positive low below the high.</p>}
      <header className="section-heading support">
        <div>
          <h3>Recent trend signals</h3>
          <p>
            First completed close above the 50-day average while the 50-day is
            above the 200-day.
          </p>
        </div>
        <Help label="Trend signals">
          These mark historical trend alignment, not a buy instruction. A later
          close below the 50-day average breaks alignment. Price and the average
          shown are those observed on the signal date.
        </Help>
      </header>
      {markers.length ? (
        <div className="table-scroll trend-table">
          <table>
            <thead>
              <tr>
                <th>Signal date</th>
                <th>Price</th>
                <th>50-day average</th>
              </tr>
            </thead>
            <tbody>
              {[...markers].reverse().map((m) => (
                <tr key={m.time}>
                  <td>
                    <span className="blue" aria-hidden="true">
                      ◆{" "}
                    </span>
                    {dateLabel(m.time)}
                  </td>
                  <td>{amount(m.price, r.quote.currency)}</td>
                  <td>{amount(m.invalidation, r.quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          No completed trend-alignment signal in the available history.
        </p>
      )}
      <p className="footnote">
        Historical signals use data available through that bar. Provider
        corrections can change reconstructed history; signal prices are not
        execution prices.
      </p>
    </section>
  );
}
