"use client";
import { useMemo, useState } from "react";
import type { Research, Candle } from "@/lib/types";
import { accumulation } from "@/lib/engine";
import { candidatePolicy, settledPolicyBars } from "@/lib/accumulation-policy";
import { evaluatePolicies } from "@/lib/policy-evaluation";
import { monthlyReadings } from "@/lib/dca-research";
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
  const [version, setVersion] = useState<"original" | "candidate">("original"),
    [showEvaluation, setShowEvaluation] = useState(false),
    [cost, setCost] = useState(10);
  const market = r.company.assetType === "crypto" ? "crypto" : "us-equity";
  const original = useMemo(
    () => accumulation(r.history, r.retrievedAt, false, market),
    [r.history, r.retrievedAt, market],
  );
  const candidate = useMemo(
    () => candidatePolicy(r.history, r.retrievedAt, market),
    [r.history, r.retrievedAt, market],
  );
  const chosen = version === "original" ? original : candidate,
    signal = chosen.confirmed;
  const readings = useMemo(
    () => monthlyReadings(r.history, r.retrievedAt, market),
    [r.history, r.retrievedAt, market],
  );
  const monthly = useMemo(() => {
    const m = new Map<string, Candle>();
    for (const b of settledPolicyBars(r.history, r.retrievedAt)) {
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
  }, [r.history, r.retrievedAt]);
  const candleColors = useMemo(
    () =>
      Object.fromEntries(
        monthly.map((b) => {
          const signal =
            chosen.history.find((s) => s.month === b.time.slice(0, 7)) ??
            (chosen.forming?.month === b.time.slice(0, 7)
              ? chosen.forming
              : null);
          return [b.time, signal ? colours[signal.multiplier] : "#b0b5bd"];
        }),
      ),
    [monthly, chosen],
  );
  const levels = useMemo(
    () =>
      version === "candidate" && candidate.confirmed
        ? [
            { label: "2× pullback", price: candidate.confirmed.buy2 },
            { label: "3× pullback", price: candidate.confirmed.buy3 },
            { label: "4× pullback", price: candidate.confirmed.buy4 },
          ]
        : [],
    [candidate, version],
  );
  const evaluation = useMemo(
    () =>
      showEvaluation
        ? evaluatePolicies(r.history, r.retrievedAt, cost, market)
        : null,
    [showEvaluation, r.history, r.retrievedAt, cost, market],
  );
  const rarity = signal
    ? chosen.history.filter((s) => s.multiplier === signal.multiplier).length
    : 0;
  return (
    <section className="accumulation-desk">
      <header className="accumulation-desk-head">
        <div>
          <span className="eyebrow">Monthly discipline · price conditions</span>
          <h2>One reading. The history behind it.</h2>
        </div>
        <div className="segments" aria-label="Accumulation policy">
          {(["original", "candidate"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={version === v}
              onClick={() => setVersion(v)}
            >
              {v === "original" ? "Original v1" : "Candidate v2"}
            </button>
          ))}
        </div>
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
                  : "#ffffff",
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
              ? `${signal.month} · confirmed`
              : version === "candidate"
                ? "36 consecutive completed months required"
                : "24 consecutive completed months required"}{" "}
            ·{" "}
            {version === "candidate"
              ? "Experimental candidate"
              : "Original experimental policy"}
          </small>
        </div>
        <dl>
          <div>
            <dt>Current month</dt>
            <dd>
              {chosen.forming
                ? `${chosen.forming.multiplier}× · forming`
                : "Not established"}
            </dd>
          </div>
          <div>
            <dt>Same confirmed zone</dt>
            <dd>
              {signal
                ? `${rarity} of ${chosen.history.length} eligible months`
                : "Not established"}
            </dd>
          </div>
          <div>
            <dt>Trim review</dt>
            <dd>
              {version === "candidate"
                ? candidate.confirmed?.trimReview
                  ? "Price extension flag"
                  : "No candidate extension flag"
                : "Separate from 0× pause"}
            </dd>
          </div>
        </dl>
      </div>
      <p className="small muted">
        Multiples of your usual contribution—not leverage or expected returns. A
        price-only condition can coexist with a weak business; review funding,
        valuation and allocation first.
      </p>
      <div className="accumulation-chart">
        <PriceChart
          bars={monthly}
          range={`monthly-policy-${version}`}
          style="candles"
          candleColors={candleColors}
          levels={levels}
        />
      </div>
      {version === "candidate" && levels.length > 0 && (
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
        <span>Latest month may still be forming</span>
      </div>
      {version === "original" &&
        readings.some((x) => x.strongest > x.confirmed) && (
          <div className="accumulation-touches">
            <b>Stronger settled-close touches</b>
            {readings
              .filter((x) => x.strongest > x.confirmed)
              .slice(-4)
              .map((x) => (
                <span key={x.month}>
                  ◇ {x.strongest}× · {dateLabel(x.date)} · month closed{" "}
                  {x.confirmed}×
                </span>
              ))}
          </div>
        )}
      <details className="policy-rules">
        <summary>See the rules and price assumptions</summary>
        {version === "candidate" ? (
          <p>
            36 settled monthly closes; robust log-price trend fitted from the
            median of pairwise slopes. Residual spread uses median absolute
            deviation with a 3% floor. 2×/3×/4× require drawdowns of at least
            15%/30%/45% and deviations of −0.75/−1.5/−2 robust units. Pause
            requires +1.5 units and 20% above trend. Trim review additionally
            requires +2.5 units and 50% twelve-month growth. Bands use the
            confirmed window and move when that window changes.
          </p>
        ) : (
          <p>
            24 completed monthly closes. 2× requires 15% drawdown and 10% below
            the average; 3× requires 30% and 20%; 4× requires 50% and 35%. More
            than 25% above the average pauses new contributions. Otherwise 1×.
            These thresholds have no demonstrated advantage.
          </p>
        )}
        <p>
          Only prior settled daily data enters a reading. The forming month
          never rewrites a confirmed month. A daily-close touch is not an
          intraday low or guaranteed fill. Model levels are not intrinsic values
          or evidence of institutional activity.
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
          : "Test the policies on this history ↗"}
      </button>
      {showEvaluation && (
        <section className="policy-evaluation">
          <header>
            <div>
              <span className="eyebrow">
                Reproducible historical comparison
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
                100 model units per month · {evaluation.months} common execution
                months · final {evaluation.holdout.months} months shown
                separately below. No contribution amount required.
              </p>
              <div className="policy-results">
                {[
                  ["Normal DCA", evaluation.fixed],
                  ["Original v1", evaluation.original],
                  ["Candidate v2", evaluation.candidate],
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
                          <dt>Month-end drawdown</dt>
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
              <h4>
                Later chronological slice · {evaluation.holdout.start} to{" "}
                {evaluation.holdout.end}
              </h4>
              <p>
                Normal DCA {amount(evaluation.holdout.fixed.value, "USD", true)}{" "}
                · Original{" "}
                {amount(evaluation.holdout.original.value, "USD", true)} ·
                Candidate{" "}
                {amount(evaluation.holdout.candidate.value, "USD", true)} model
                units. Each starts with zero capital in this slice. Rules are
                fixed, not tuned here.
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
