"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { REWIND_HORIZONS, rewindFor, rewindStats, type Horizon } from "@/lib/rewind";
import { amount, dateLabel, percent } from "@/lib/format";

const TREND = { above: "Above both averages", below: "Below both averages", mixed: "Between its averages" } as const;
const BAND = { low: "RSI under 30", mid: "RSI 30 to 70", high: "RSI over 70" } as const;
const AHEAD: Record<Horizon, string> = { 21: "1 month later", 63: "3 months later", 126: "6 months later" };
const W = 900,
  H = 230;

export default function Rewind({ research: r, initial = null }: { research: Research; initial?: number | null }) {
  const days = useMemo(
    () => rewindFor(r.history, r.retrievedAt, r.company.assetType === "crypto" ? "crypto" : "us-equity"),
    [r.history, r.retrievedAt, r.company.assetType],
  );
  const [picked, setPicked] = useState<number | null>(initial);
  const geometry = useMemo(() => {
    if (days.length < 60) return null;
    const values = days.flatMap((d) => [d.close, d.ma50, d.ma200]).filter((v): v is number => typeof v === "number");
    const lo = Math.min(...values),
      hi = Math.max(...values),
      span = hi - lo || 1;
    const x = (i: number) => 12 + (i / (days.length - 1)) * (W - 24),
      y = (v: number) => H - 10 - ((v - lo) / span) * (H - 24);
    const path = (pick: (d: (typeof days)[number]) => number | null) =>
      days.map((d, i) => ({ v: pick(d), i })).filter((p) => p.v != null).map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)} ${y(p.v!).toFixed(1)}`).join(" ");
    return { x, y, close: path((d) => d.close), ma50: path((d) => d.ma50), ma200: path((d) => d.ma200) };
  }, [days]);
  if (!geometry) return null;
  const last = days.length - 1,
    idx = Math.max(0, Math.min(last, picked ?? last)),
    day = days[idx],
    stats = rewindStats(days, idx, 63),
    currency = r.quote.currency,
    atLatest = idx === last;
  const move = (n: number) => setPicked(Math.max(0, Math.min(last, idx + n)));
  const cx = geometry.x(idx);
  return (
    <section className="rewind" aria-label="Rewind through past sessions">
      <header className="rewind-head">
        <div>
          <span className="eyebrow">Rewind</span>
          <h2>What did the signals say then, and what happened next?</h2>
          <p>Drag back through time. The chart reveals only what was known on the day you choose; the veiled part is what followed.</p>
        </div>
        <div className="rewind-date" aria-live="polite">
          <b>{atLatest ? "Latest completed session" : dateLabel(day.time)}</b>
          <span className="num">{amount(day.close, currency)}</span>
        </div>
      </header>
      <div className="rewind-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Price history with a cursor at ${day.time}. 50-day and 200-day averages are shown.`} preserveAspectRatio="none">
          <path className="rewind-ma200" d={geometry.ma200} />
          <path className="rewind-ma50" d={geometry.ma50} />
          <path className="rewind-line" d={geometry.close} />
          {!atLatest && <rect className="rewind-veil" x={cx} y="0" width={W - cx} height={H} />}
          {REWIND_HORIZONS.map((h) => {
            const f = day.forward[h];
            if (f == null || idx + h > last) return null;
            return <circle key={h} className="rewind-mark" data-sign={f >= 0 ? "up" : "down"} cx={geometry.x(idx + h)} cy={geometry.y(days[idx + h].close)} r="6" />;
          })}
          <line className="rewind-cursor" x1={cx} x2={cx} y1="0" y2={H} />
          <circle className="rewind-dot" cx={cx} cy={geometry.y(day.close)} r="7" />
        </svg>
        <div className="rewind-legend" aria-hidden="true">
          <span data-k="line">Price</span>
          <span data-k="ma50">50-day</span>
          <span data-k="ma200">200-day</span>
        </div>
      </div>
      <div className="rewind-controls">
        <button type="button" onClick={() => move(-21)} disabled={idx === 0}>
          ← 1 month
        </button>
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={idx}
          aria-label="Rewind to a past session"
          aria-valuetext={atLatest ? "Latest completed session" : dateLabel(day.time)}
          onChange={(e) => setPicked(Number(e.target.value))}
        />
        <button type="button" onClick={() => move(21)} disabled={atLatest}>
          1 month →
        </button>
        <button type="button" onClick={() => setPicked(null)} disabled={atLatest} className="rewind-latest">
          Latest
        </button>
      </div>
      <div className="rewind-grid">
        <div className="rewind-state">
          <h3>What the signals said that day</h3>
          <dl>
            <div>
              <dt>Trend</dt>
              <dd data-tone={day.trend === "above" ? "positive" : day.trend === "below" ? "risk" : "neutral"}>{day.trend ? TREND[day.trend] : "Not enough history"}</dd>
            </div>
            <div>
              <dt>RSI · 14</dt>
              <dd>{day.rsi == null ? "Not enough history" : `${day.rsi.toFixed(0)} · ${BAND[day.rsiBand!]}`}</dd>
            </div>
            <div>
              <dt>From 1-year high</dt>
              <dd>{percent(day.drawdown)}</dd>
            </div>
          </dl>
        </div>
        <div className="rewind-after">
          <h3>What followed</h3>
          {atLatest ? (
            <p className="rewind-note">This is the latest session, so nothing has followed yet. Drag back to see outcomes.</p>
          ) : (
            <ul>
              {REWIND_HORIZONS.map((h) => {
                const f = day.forward[h];
                return (
                  <li key={h} data-sign={f == null ? "none" : f >= 0 ? "up" : "down"}>
                    <span>{AHEAD[h]}</span>
                    <i aria-hidden="true">
                      <u style={{ width: `${f == null ? 0 : Math.min(100, Math.abs(f) * 2.5)}%` }} />
                    </i>
                    <b className="num">{f == null ? "Not yet observed" : percent(f, true)}</b>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="rewind-like">
          <h3>Days like this one</h3>
          {stats && stats.like.windows >= 3 && stats.all.median != null && stats.like.median != null ? (
            <>
              <p>
                On <b>{stats.like.days}</b> past days in the same state ({TREND[stats.state.trend].toLowerCase()}, {BAND[stats.state.rsiBand]}), the price was higher 3 months later{" "}
                <b>{stats.like.positiveShare!.toFixed(0)}%</b> of the time, with a median change of <b>{percent(stats.like.median, true)}</b>.
              </p>
              <p className="rewind-base">
                On all days: higher <b>{stats.all.positiveShare!.toFixed(0)}%</b> of the time, median <b>{percent(stats.all.median, true)}</b>.
              </p>
              <small>
                These days overlap, so they stand for about {stats.like.windows} separate 3-month windows. Past behaviour of one stock does not predict its future.
              </small>
            </>
          ) : (
            <p className="rewind-note">Too few matching windows in this company’s history to say anything useful about days like this.</p>
          )}
        </div>
      </div>
    </section>
  );
}
