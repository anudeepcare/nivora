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
  const [custom, setCustom] = useState(false),
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
          .filter((x) => [0.5, 0.618, 0.786].includes(x.ratio))
          .map((x) => ({ label: `${x.ratio}`, price: x.price })),
      [levels],
    ),
    weekly = weeklyStudies(r.history, r.retrievedAt),
    markers = useMemo(
      () => trendMarkers(r.history, r.retrievedAt).slice(-4),
      [r],
    );
  return (
    <section className="panel support">
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
      <PriceChart bars={bars} range="126 sessions" levels={lines} />
      <div className="level-grid">
        {levels.map((x) => (
          <div key={x.ratio}>
            <span>
              {x.ratio.toFixed(3)} · {(x.ratio * 100).toFixed(1)}%
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
      {!levels.length && <p>Choose a positive low below the high.</p>}
      <header className="section-heading support">
        <div>
          <h3>First-known trend markers</h3>
          <p>
            Close above SMA50, with SMA50 above SMA200; first aligned completed
            bar.
          </p>
        </div>
      </header>
      <div className="compact-records">
        {markers.map((m) => (
          <div key={m.time}>
            <span className="blue" aria-hidden="true">
              ◆
            </span>
            <div>
              <strong>
                {m.label} · {dateLabel(m.time)}
              </strong>
              <small>
                Observed at {amount(m.price, r.quote.currency)} · then-current
                SMA50 {amount(m.invalidation, r.quote.currency)}
              </small>
            </div>
          </div>
        ))}
      </div>
      <p className="footnote">
        A later close below the current SMA50 breaks alignment. Markers use only
        data available through their bar, are not execution prices, and do not
        assess the business. Historical source corrections can change
        reconstructed history.
      </p>
    </section>
  );
}
