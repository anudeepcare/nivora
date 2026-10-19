"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import TradeReference from "./TradeReference";
import HistoricalConditions from "./HistoricalConditions";
import MarketContext from "./MarketContext";
import ProfessionalContext from "./ProfessionalContext";
import { planStress } from "@/lib/professional-studies";
import { advancedStudies, tradePlan } from "@/lib/advanced-research";

import { amount, percent, dateLabel } from "@/lib/format";

export default function AdvancedResearch({
  research: r,
}: {
  research: Research;
}) {
  const s = useMemo(
    () => advancedStudies(r.history, r.retrievedAt),
    [r.history, r.retrievedAt],
  );
  const [capital, setCapital] = useState("10000"),
    [risk, setRisk] = useState("1"),
    [entry, setEntry] = useState(""),
    [stop, setStop] = useState(""),
    [target, setTarget] = useState(""),
    [slip, setSlip] = useState("0.1"),
    [probability, setProbability] = useState("50");
  const plan = tradePlan(
      Number(capital),
      Number(risk),
      Number(entry),
      Number(stop),
      Number(target),
      Number(slip),
    ),
    currency = r.quote.currency || r.company.currency;
  const stress = plan.valid
    ? planStress({
        quantity: plan.quantity,
        entry: Number(entry),
        stop: Number(stop),
        target: Number(target),
        slippage: Number(slip),
        capital: Number(capital),
        atr: s.atr,
        gap: s.largestGap,
        dollarVolume: s.averageDollarVolume,
        winProbability: Number(probability),
      })
    : null;
  return (
    <div className="advanced-workspace">
      <header className="advanced-intro">
        <div>
          <span className="eyebrow">ADVANCED · RESEARCH TO ACTION</span>
          <h2>See the setup. Understand the risk.</h2>
          <p>
            {s.count} completed observations ·{" "}
            {s.asOf
              ? `Price studies through ${dateLabel(s.asOf)}`
              : "More price history needed"}
          </p>
        </div>
        <span className="advanced-tag">Evidence, not certainty</span>
      </header>
      <nav className="advanced-nav" aria-label="Advanced sections">
        {[
          ["desk", "Risk desk"],
          ["context", "Market context"],
          ["plan", "Trade plan"],
          ["history", "Historical study"],
        ].map(([id, label]) => (
          <a key={id} href={`#advanced-${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <ProfessionalContext research={r} />
      <div id="advanced-context">
        <MarketContext key={r.company.symbol} research={r} />
      </div>
      <section id="advanced-plan" className="advanced-plan">
        <header>
          <span className="eyebrow">HYPOTHETICAL LONG PLAN</span>
          <h3>Size the risk before the position</h3>
          <p>
            All amounts in {currency}. Whole units, no leverage or currency
            conversion. No order is submitted.
          </p>
        </header>
        <div className="atr-presets" aria-label="Hypothetical ATR stop presets">
          <span>Set invalidation below your entry:</span>
          {[1, 1.5, 2].map((k) => (
            <button
              key={k}
              disabled={
                !s.atr || !Number(entry) || Number(entry) - k * s.atr <= 0
              }
              onClick={() =>
                s.atr && setStop((Number(entry) - k * s.atr).toFixed(4))
              }
            >
              {k}× ATR
            </button>
          ))}
        </div>
        <div className="advanced-plan-fields">
          {[
            ["Capital", capital, setCapital],
            ["Risk budget · %", risk, setRisk],
            ["Entry price", entry, setEntry],
            ["Invalidation price", stop, setStop],
            ["Target price", target, setTarget],
            ["Slippage each side · %", slip, setSlip],
            ["Assumed win probability · %", probability, setProbability],
          ].map(([label, value, set]) => (
            <label key={String(label)}>
              {String(label)}
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={String(value)}
                onChange={(e) => (set as (s: string) => void)(e.target.value)}
              />
            </label>
          ))}
        </div>
        {plan.valid ? (
          <div className="advanced-plan-result" aria-live="polite">
            {[
              ["Whole units", String(plan.quantity)],
              ["Planned loss", amount(plan.plannedLoss, currency)],
              ["Reward / risk", plan.rewardRisk.toFixed(2) + "×"],
              ["Capital used", amount(plan.capitalUsed, currency)],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="advanced-plan-hint">
            Enter a positive capital and risk budget (up to 10%), with
            invalidation below entry and target above entry. Slippage must be
            0–5%.
          </p>
        )}
        {stress && (
          <section className="trade-stress">
            <h4>Risk in your money</h4>
            <div className="advanced-plan-result">
              {[
                ["Breakeven win rate", percent(stress.breakeven)],
                [
                  "Expected P&L · your probability",
                  amount(stress.expectancy, currency),
                ],
                ["Position / capital", percent(stress.positionPct)],
                [
                  "Order / typical daily traded value",
                  stress.participation == null
                    ? "Volume needed"
                    : percent(stress.participation),
                ],
                [
                  "Observed-gap stress loss",
                  stress.gapLoss == null
                    ? "History needed"
                    : amount(stress.gapLoss, currency),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p className="small muted">
              Win probability is your assumption, not an estimated hit rate. Gap
              stress applies the largest absolute observed opening gap downward
              from entry, then your slippage. This scenario can exceed the
              planned stop loss; it is not the worst possible loss.
            </p>
            <div className="stress-scenarios">
              {stress.scenarios.map((x) => (
                <div key={x.label}>
                  <span>{x.label}</span>
                  <span>{amount(x.price, currency)}</span>
                  <strong className={x.pnl < 0 ? "negative" : "positive"}>
                    {amount(x.pnl, currency)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        )}
        <p className="small muted">
          Quantity is limited by both available capital and the risk budget. Gap
          moves can exceed planned loss. Fees, taxes, market impact and
          financing costs are excluded. Slippage is your assumption, not an
          execution estimate.
        </p>
      </section>
      <TradeReference
        research={r}
        inputs={{
          capital: Number(capital),
          risk: Number(risk),
          entry: Number(entry),
          stop: Number(stop),
          target: Number(target),
          slippage: Number(slip),
        }}
      />
      <div id="advanced-history">
        <HistoricalConditions key={r.company.symbol} research={r} />
      </div>
      <footer className="advanced-footnote">
        Studies use existing supplied history; no indicator-specific API calls.
        Options/order-flow data and validated strategy backtests are not
        included. Benchmark and historical condition studies are descriptive
        tools with separate coverage limits. Historical measurements do not
        establish future profitability.
      </footer>
    </div>
  );
}
