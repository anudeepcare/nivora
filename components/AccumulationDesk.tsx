"use client";
import { useMemo, useState } from "react";
import type { Research, Candle } from "@/lib/types";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "@/lib/accumulation-policy-v3";
import { evaluateAccumulation } from "@/lib/accumulation-evaluation";
import { amount, percent, dateLabel } from "@/lib/format";
import { PriceChart } from "./Charts";
const colours: Record<number, string> = {
  0: "#d89a20",
  1: "#7d9db0",
  2: "#12a28b",
  3: "#71b337",
  4: "#ac68e5",
};
export default function AccumulationDesk({
  research: r,
}: {
  research: Research;
}) {
  const [showEvaluation, setShowEvaluation] = useState(false),
    [cost, setCost] = useState(10);
  const market = r.company.assetType === "crypto" ? "crypto" : "us-equity";
  const chosen = useMemo(
      () => researchAccumulation(r.history, r.retrievedAt, market),
      [r.history, r.retrievedAt, market],
    ),
    signal = chosen.confirmed;
  const monthly = useMemo(() => {
    const m = new Map<string, Candle>();
    for (const b of adaptiveSettledBars(r.history, r.retrievedAt, market)) {
      const key = b.time.slice(0, 7),
        prev = m.get(key);
      m.set(
        key,
        prev
          ? {
              ...prev,
              time: b.time,
              high: Math.max(prev.high, b.high),
              low: Math.min(prev.low, b.low),
              close: b.close,
              volume: prev.volume + b.volume,
            }
          : { ...b },
      );
    }
    return [...m.values()].slice(-60);
  }, [r.history, r.retrievedAt, market]);
  const candleColors = useMemo(
    () =>
      Object.fromEntries(
        monthly.map((b) => {
          const s =
            chosen.history.find((s) => s.month === b.time.slice(0, 7)) ??
            (chosen.forming?.month === b.time.slice(0, 7)
              ? chosen.forming
              : null);
          return [b.time, s ? colours[s.multiplier] : "#b0b5bd"];
        }),
      ),
    [monthly, chosen],
  );
  const levels = useMemo(
    () =>
      signal
        ? [
            { label: "2× pullback", price: signal.buy2 },
            { label: "3× pullback", price: signal.buy3 },
            { label: "4× pullback", price: signal.buy4 },
          ]
        : [],
    [signal],
  );
  const evaluation = useMemo(
    () =>
      showEvaluation
        ? evaluateAccumulation(r.history, r.retrievedAt, cost, market)
        : null,
    [showEvaluation, r.history, r.retrievedAt, cost, market],
  );
  return (
    <section className="accumulation-desk">
      <header className="accumulation-desk-head">
        <div>
          <span className="eyebrow">Monthly discipline · price conditions</span>
          <h2>One reading. The history behind it.</h2>
        </div>
        <span className="policy-version">Trend-adjusted · v3</span>
      </header>
      <div className="accumulation-summary">
        <div>
          <span
            className="accumulation-badge"
            style={{
              background: signal ? colours[signal.multiplier] : undefined,
              color:
                signal && [0, 1, 3].includes(signal.multiplier)
                  ? "#15313d"
                  : "#fff",
            }}
          >
            {signal ? `${signal.multiplier}×` : "—"}
          </span>
          <h3>
            {signal
              ? signal.multiplier === 0
                ? "Pause new contributions"
                : signal.multiplier === 1
                  ? "Normal contribution condition"
                  : "Stronger pullback condition"
              : "More monthly history needed"}
          </h3>
          <p>{signal?.reason ?? chosen.reason}</p>
          <small>
            {signal
              ? `${signal.month} · confirmed at ${dateLabel(signal.date)}`
              : "24 consecutive completed prior months required"}
          </small>
        </div>
        <dl>
          <div>
            <dt>Current month</dt>
            <dd>
              {chosen.forming
                ? `${chosen.forming.multiplier}× · forming`
                : "No forming reading"}
            </dd>
          </div>
          <div>
            <dt>Same confirmed zone</dt>
            <dd>
              {signal
                ? `${chosen.history.filter((s) => s.multiplier === signal.multiplier).length} of ${chosen.history.length} eligible months`
                : "Not established"}
            </dd>
          </div>
          <div>
            <dt>Trend risk</dt>
            <dd>{signal?.risk ?? "Not assessed"}</dd>
          </div>
        </dl>
      </div>
      <p className="small muted">
        Multiples of your usual contribution—not leverage or expected returns.
        Confirmed months stay fixed; the forming reading can change. A deeper
        price pullback does not establish a better business or confirmed
        support.
      </p>
      <div className="accumulation-chart">
        <PriceChart
          bars={monthly}
          range="monthly-policy-v3"
          style="candles"
          candleColors={candleColors}
          levels={levels}
        />
      </div>
      {!!levels.length && (
        <div className="candidate-levels">
          {levels.map((l) => (
            <div key={l.label}>
              <span>{l.label}</span>
              <strong>{amount(l.price, r.quote.currency)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="accumulation-legend">
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n}>
            <i style={{ background: colours[n] }} />
            {n === 0 ? "Pause" : `${n}×`}
          </span>
        ))}
        <span>
          <i style={{ background: "#b0b5bd" }} />
          No eligible signal
        </span>
      </div>
      <details className="policy-rules">
        <summary>See the rules and price assumptions</summary>
        <p>
          Uses the 24 completed months before each reading. A robust log-price
          trend uses median pairwise slopes. Spread is the larger of residual
          variability, monthly return variability and a 7% floor. 2×/3×/4×
          require drawdowns of 12%/25%/40% from the prior monthly high and
          deviations below trend of 0.7/1.35/2 spread units. Pause requires two
          units and 25% above trend. These fixed rules have no demonstrated
          outperformance.
        </p>
        <p>
          US observations settle after 5 PM New York; crypto uses completed UTC
          days. A completed month needs its final market session. Missing or
          conflicting history is unscored, never a 0× instruction. Displayed
          bands use the last confirmed window and do not predict future prices.
          Older v1/v2 evaluators remain in the source for reproducibility.
        </p>
      </details>
      <button
        type="button"
        className="text-button"
        onClick={() => setShowEvaluation(!showEvaluation)}
        aria-expanded={showEvaluation}
      >
        {showEvaluation
          ? "Hide historical comparison"
          : "Test this policy on available history ↗"}
      </button>
      {showEvaluation && (
        <section className="policy-evaluation">
          <header>
            <div>
              <span className="eyebrow">
                Hypothetical historical comparison
              </span>
              <h3>Same deposits. Same execution dates.</h3>
            </div>
            <label>
              Fees + slippage · bps
              <input
                type="number"
                min="0"
                max="200"
                value={cost}
                onChange={(e) =>
                  setCost(
                    Math.max(0, Math.min(200, Number(e.target.value) || 0)),
                  )
                }
              />
            </label>
          </header>
          {evaluation?.available ? (
            <>
              <p>
                100 model units per month · {evaluation.months} completed
                execution months. Contributions above 1× require previously
                unspent cash.
              </p>
              <div className="policy-results">
                {[
                  ["Normal DCA", evaluation.fixed],
                  ["Trend-adjusted v3", evaluation.adaptive],
                ].map(([name, result]) => {
                  const x = result as typeof evaluation.fixed;
                  return (
                    <article key={String(name)}>
                      <h4>{String(name)}</h4>
                      <strong>{amount(x.value, "USD", true)}</strong>
                      <span>Model units at end</span>
                      <dl>
                        <div>
                          <dt>Deposited</dt>
                          <dd>{amount(x.contributed, "USD", true)}</dd>
                        </div>
                        <div>
                          <dt>Unspent cash</dt>
                          <dd>{amount(x.cash, "USD", true)}</dd>
                        </div>
                        <div>
                          <dt>Monthly drawdown</dt>
                          <dd>{percent(x.drawdown)}</dd>
                        </div>
                        <div>
                          <dt>Costs</dt>
                          <dd>{amount(x.costs, "USD", true)}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
              <p>
                Later {evaluation.holdout.months}-month slice, restarted at
                zero: normal DCA{" "}
                {amount(evaluation.holdout.fixed.value, "USD", true)} ·
                trend-adjusted{" "}
                {amount(evaluation.holdout.adaptive.value, "USD", true)} model
                units.
              </p>
              <details>
                <summary>Execution details and limitations</summary>
                {evaluation.limitations.map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </details>
            </>
          ) : (
            <p>
              {evaluation && !evaluation.available
                ? evaluation.reason
                : "Evaluation unavailable."}
            </p>
          )}
        </section>
      )}
    </section>
  );
}
