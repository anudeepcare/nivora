"use client";
import detail from "./PaceDeskDetails.module.css";
import PaceEvidenceJourney from "./PaceEvidenceJourney";
import PaceMonthHistory from "./PaceMonthHistory";
import PaceReadings from "./PaceReadings";
import styles from "./ResearchLens.module.css";
import PaceHistoryInsights from "./PaceHistoryInsights";
import { pacePeriods } from "@/lib/pace-presentation";
import { useMemo, useState } from "react";
import type { Research, Candle } from "@/lib/types";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "@/lib/accumulation-policy-v7";
import { weeklyAccumulation } from "@/lib/accumulation-weekly";
import { evaluateAccumulation } from "@/lib/accumulation-evaluation";
import { amount, percent, dateLabel } from "@/lib/format";
import PaceHelp from "./PaceHelp";
import { paceCode } from "@/lib/pace-presentation";
import { PriceChart } from "./Charts";
import {
  paceChartColours as colours,
  paceChartLevels,
} from "@/lib/pace-chart-levels";
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
    signal = confirmed ?? chosen.forming;
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
    () => paceChartLevels(chosen.forming, confirmed),
    [chosen.forming, confirmed],
  );
  const evaluation = useMemo(
    () =>
      showEvaluation && !weekly
        ? evaluateAccumulation(r.history, r.retrievedAt, cost, market)
        : null,
    [showEvaluation, r.history, r.retrievedAt, cost, market, weekly],
  );
  return (
    <section
      className={`accumulation-desk ${styles.paceChartFirst} ${detail.desk}`}
    >
      <header className="accumulation-desk-head">
        <div>
          <span className="eyebrow">
            {weekly
              ? "Weekly conditions · separate time horizon"
              : "Cycle-relative · monthly discipline"}
          </span>
          <h2>
            AURYN Pace{" "}
            <span className={detail.titleNote}>The price in perspective</span>
          </h2>
          <div className={styles.paceMeta}>
            <small>Model {chosen.version} · settled prices</small>
            <PaceHelp trigger="What does P mean?" />
          </div>
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
      <div className={detail.observations}>
        <div className={styles.paceReadings}>
          <PaceReadings
            compact
            readings={pacePeriods(
              { ...confirmed, forming: chosen.forming },
              weekly,
            )}
          />
        </div>
        <div className={detail.priceBasis} aria-label="Price observation basis">
          <span>
            Settled chart close{" "}
            <strong>{amount(monthly.at(-1)?.close, r.quote.currency)}</strong> ·{" "}
            {dateLabel(monthly.at(-1)?.time)}
          </span>
          <span>
            Latest quoted price{" "}
            <strong>{amount(r.quote.price, r.quote.currency)}</strong> ·{" "}
            {r.quote.asOf && Number.isFinite(Date.parse(r.quote.asOf))
              ? new Date(r.quote.asOf)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 16) + " UTC"
              : "Observation time not supplied"}
            {r.quote.stale ? " · stale" : ""}
          </span>
          <small>
            The quote is not used to overwrite settled chart history. Different
            observation times can produce different prices.
          </small>
        </div>
      </div>
      <div className="accumulation-chart">
        <div className={detail.chartHeading}>
          <span>{weekly ? "Weekly" : "Monthly"} price landscape</span>
          <small>
            {monthly.length} displayed {weekly ? "weeks" : "months"} ·
            zone-colored candles
          </small>
        </div>
        <PriceChart
          bars={monthly}
          range={weekly ? "weekly-policy-v1" : chosen.version}
          style="candles"
          candleColors={candleColors}
          levels={levels}
        />
      </div>
      {!weekly && <PaceMonthHistory key={r.company.symbol} research={r} />}
      <div className="accumulation-summary">
        <div>
          <small>
            {confirmed
              ? "Last confirmed reading · rationale"
              : signal
                ? "Current forming reading · rationale"
                : "History coverage"}
          </small>
          <p>{signal?.reason ?? chosen.reason}</p>
          {!signal && (
            <small>
              {weekly
                ? "52 consecutive completed prior weeks required"
                : "12 consecutive completed prior months required"}
            </small>
          )}
        </div>
        <dl>
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
      {signal?.trimReview && (
        <div className="accumulation-extension" role="note">
          <strong>
            {trimTier === "strong"
              ? "Price extension review"
              : "Review price extension"}
          </strong>
          <span>
            Extreme distance above trend. Review exposure and the business case;
            this is separate from the accumulation zone and specifies no sale
            amount.
          </span>
        </div>
      )}
      <PaceEvidenceJourney research={r} />
      {!!levels.length && (
        <details open className={detail.levels}>
          <summary>Conditional zone prices</summary>
          <dl>
            {levels.map((l) => (
              <div key={l.label}>
                <dt>
                  <i
                    className={detail.zoneSwatch}
                    style={{ background: l.color }}
                    aria-hidden="true"
                  />
                  {l.label}
                </dt>
                <dd>{amount(l.price, r.quote.currency)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <div className="accumulation-legend">
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n}>
            <i style={{ background: colours[n] }} />
            {n === 0 ? "Pause" : paceCode(n)}
          </span>
        ))}
        <span>
          <i style={{ background: "#b0b5bd" }} />
          No eligible signal
        </span>
      </div>
      {weekly && (
        <p className="small muted">
          Weekly v1 is a separate, shorter-horizon price policy. The available
          historical simulation remains monthly only.
        </p>
      )}
      {!weekly && <PaceHistoryInsights research={r} />}
      <details className="policy-rules">
        <summary>See the rules and price assumptions</summary>
        <p className="small muted">
          P means Pace. Levels describe accumulation zones, not purchase
          multiples, leverage or expected returns.{" "}
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
          reading can change. A deeper price pullback does not establish a
          better business or confirmed support.
        </p>
        <p>
          {weekly
            ? "Weekly v1 uses 52 completed weeks and a robust fitted log-price trend. Its 2×/3×/4× gates use 12%/25%/40% drawdown and 0.7/1.35/2 robust spread units."
            : "The current monthly model uses a fixed technical classifier across monthly price position, daily trend, volatility and momentum. Existing extension rules remain in place. Earlier observations and insufficient-history cases retain their original policy version. Conditional price levels are local transitions, not guarantees for all prices beyond a threshold."}{" "}
          Weekly and monthly calculations differ. Historical readings do not
          establish future outperformance.
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
            : "View legacy-policy backtest ↗"}
        </button>
      )}
      {showEvaluation && !weekly && (
        <section className={`policy-evaluation ${styles.paceEvaluation}`}>
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
                execution months. This legacy price-only comparison spends 1–4
                times a model deposit, using carried cash above the regular
                deposit. It does not implement today’s P1 Watch/Hold rule or
                historical business checks, and is not validation of AURYN’s
                decisions.
              </p>
              <div className="policy-results">
                {[
                  ["Fixed contributions", evaluation.fixed],
                  ["Legacy price-only policy", evaluation.adaptive],
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
                zero: fixed contributions{" "}
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
