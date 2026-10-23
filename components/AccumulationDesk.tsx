"use client";
import { useMemo, useState } from "react";
import type { Research, Candle } from "@/lib/types";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "@/lib/accumulation-policy-v5";
import { weeklyAccumulation } from "@/lib/accumulation-weekly";
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
  const [cadence, setCadence] = useState<"monthly" | "weekly">("monthly");
  const weekly = cadence === "weekly";
  const [showEvaluation, setShowEvaluation] = useState(false),
    [cost, setCost] = useState(10);
  const market = r.company.assetType === "crypto" ? "crypto" : "us-equity";
  const chosen = useMemo(
      () =>
        weekly
          ? weeklyAccumulation(r.history, r.retrievedAt, market)
          : researchAccumulation(r.history, r.retrievedAt, market),
      [r.history, r.retrievedAt, market, weekly],
    ),
    confirmed = chosen.confirmed,
    signal = chosen.forming ?? confirmed;
  const trimTier = signal && "trimTier" in signal ? signal.trimTier : null;
  const monthly = useMemo(() => {
    if (weekly)
      return weeklyAccumulation(r.history, r.retrievedAt, market).bars.slice(
        -104,
      );
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
  }, [r.history, r.retrievedAt, market, weekly]);
  const candleColors = useMemo(
    () =>
      Object.fromEntries(
        monthly.map((b) => {
          const s =
            chosen.history.find((s) =>
              weekly ? s.date === b.time : s.month === b.time.slice(0, 7),
            ) ??
            ((
              weekly
                ? chosen.forming?.date === b.time
                : chosen.forming?.month === b.time.slice(0, 7)
            )
              ? chosen.forming
              : null);
          return [
            b.time,
            s && "trimTier" in s && s.trimTier === "strong"
              ? "#bd4660"
              : s
                ? colours[s.multiplier]
                : "#b0b5bd",
          ];
        }),
      ),
    [monthly, chosen, weekly],
  );
  const levels = useMemo(
    () =>
      signal
        ? [
            { label: "2× pullback", price: signal.buy2 },
            { label: "3× pullback", price: signal.buy3 },
            { label: "4× pullback", price: signal.buy4 },
          ].filter((level) => level.price > 0)
        : [],
    [signal],
  );
  const evaluation = useMemo(
    () =>
      showEvaluation && !weekly
        ? evaluateAccumulation(r.history, r.retrievedAt, cost, market)
        : null,
    [showEvaluation, r.history, r.retrievedAt, cost, market, weekly],
  );
  return (
    <section className="accumulation-desk">
      <header className="accumulation-desk-head">
        <div>
          <span className="eyebrow">
            {weekly
              ? "Weekly conditions · separate time horizon"
              : "Cycle-relative · monthly discipline"}
          </span>
          <h2>One reading. The history behind it.</h2>
        </div>
        <div className="segments" aria-label="Accumulation time horizon">
          {(["monthly", "weekly"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={cadence === v}
              onClick={() => setCadence(v)}
            >
              {v === "monthly" ? "Monthly" : "Weekly"}
            </button>
          ))}
        </div>
      </header>
      <div className="accumulation-summary">
        <div>
          <span
            className="accumulation-badge"
            style={{
              background:
                trimTier === "strong"
                  ? "var(--red)"
                  : signal
                    ? colours[signal.multiplier]
                    : undefined,
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
                ? trimTier === "strong"
                  ? "Strong trim review"
                  : "Pause / trim review"
                : signal.multiplier === 1
                  ? "Normal contribution condition"
                  : "Stronger pullback condition"
              : `More ${cadence} history needed`}
          </h3>
          <p>{signal?.reason ?? chosen.reason}</p>
          <small>
            {signal
              ? `${chosen.forming ? (weekly ? "Current week · forming" : "Current month · forming") : weekly ? "Confirmed week ending" : signal.month + " · confirmed at"} ${dateLabel(signal.date)}`
              : weekly
                ? "52 consecutive completed prior weeks required"
                : "12 consecutive completed prior months required"}
          </small>
        </div>
        <dl>
          <div>
            <dt>{weekly ? "Last confirmed week" : "Last confirmed month"}</dt>
            <dd>
              {confirmed
                ? `${confirmed.multiplier}× · confirmed · ${dateLabel(confirmed.date)}`
                : "No confirmed reading"}
            </dd>
          </div>
          <div>
            <dt>Same confirmed zone</dt>
            <dd>
              {confirmed
                ? `${chosen.history.filter((s) => s.multiplier === confirmed.multiplier).length} of ${chosen.history.length} eligible ${weekly ? "weeks" : "months"}`
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
        {signal &&
          "historyBasis" in signal &&
          signal.historyBasis === "limited" &&
          "priorMonths" in signal && (
            <strong className="dca-limited-history">
              Limited listing history · {String(signal.priorMonths)} prior
              completed months.{" "}
            </strong>
          )}
        Completed periods stay fixed for unchanged input history; the forming
        reading can change. A deeper price pullback does not establish a better
        business or confirmed support.
      </p>
      {signal?.trimReview && (
        <div className="accumulation-extension" role="note">
          <strong>
            {trimTier === "strong"
              ? "Strong trim review"
              : "Review price extension"}
          </strong>
          <span>
            Extreme distance above trend. Review exposure and the business case;
            this is separate from the contribution multiplier and specifies no
            sale amount.
          </span>
        </div>
      )}
      <div className="accumulation-chart">
        <PriceChart
          bars={monthly}
          range={weekly ? "weekly-policy-v1" : "monthly-policy-v5"}
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
      {weekly && (
        <p className="small muted">
          Weekly v1 is a shorter-horizon research policy, not a replica of
          another service. The available historical simulation remains monthly
          only.
        </p>
      )}
      <details className="policy-rules">
        <summary>See the rules and price assumptions</summary>
        <p>
          {weekly
            ? "Weekly v1 uses 52 completed weeks and a robust fitted log-price trend. Its 2×/3×/4× gates use 12%/25%/40% drawdown and 0.7/1.35/2 robust spread units."
            : "Monthly v5 uses the preceding 12 completed monthly closes for its cycle average and sample spread (minimum 10% of that average). Readings with 12–23 prior completed months are labelled limited history; 24 prior months use the standard robust-trend guard. The 2×/3×/4× gates require 10%/25%/35% below the cycle average and 0.5/0.95/1.3 spread units below it. Positive extension reviews also retain the robust-trend upper guard and a severe cycle-extension check."}
          Weekly and monthly calculations differ. Matching selected reference
          readings does not establish an investment edge or the private
          reference formula.
        </p>
        <p>
          US observations settle after 5 PM New York; crypto uses completed UTC
          days. A completed month needs its final market session. Missing or
          conflicting history is unscored, never a 0× instruction. Displayed
          bands use the forming reading's window when available, otherwise the
          last confirmed window; they do not predict future prices. Weekly
          confirmation requires the final expected session (US Friday, adjusted
          for standard Friday holidays; crypto Sunday UTC). Missing closes
          withhold the reading. Weekly and monthly policies can disagree and
          must not be combined as two contributions. Older v1/v2 evaluators
          remain in the source for reproducibility.
        </p>
      </details>
      {!weekly && (
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
      )}
      {showEvaluation && !weekly && (
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
                  ["Cycle-relative v5", evaluation.adaptive],
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
