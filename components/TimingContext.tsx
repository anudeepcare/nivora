"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { researchDecision } from "@/lib/decision-research";
import { percent } from "@/lib/format";
import { Help } from "./Ui";
export default function TimingContext({ research: r }: { research: Research }) {
  const d = useMemo(() => researchDecision(r), [r]),
    t = d.timing;
  const metrics = [
    {
      label: "Annualized volatility",
      value: percent(t.volatility),
      tone: "neutral",
      help: "Sample standard deviation of daily log returns, annualized; at least 60 observations. Historical variability is not a forecast loss.",
    },
    {
      label: "Maximum observed drawdown",
      value: percent(t.maxDrawdown),
      tone: t.maxDrawdown != null && t.maxDrawdown < 0 ? "risk" : "neutral",
      help: "Largest peak-to-trough decline in the supplied history. Different history lengths can produce different results.",
    },
    {
      label: "52-week range position",
      value: percent(t.rangePosition),
      tone: "neutral",
      help: "Position within approximately 252 completed daily observations. A low position does not establish support or value.",
    },
    {
      label: "MACD histogram",
      value: t.histogram == null ? "—" : t.histogram.toFixed(2),
      tone:
        t.histogram == null || t.histogram === 0
          ? "neutral"
          : t.histogram < 0
            ? "risk"
            : "positive",
      help: "12/26-day MACD less its 9-day signal, in price units. Direction describes momentum, not business value.",
    },
  ];
  return (
    <section className="timing-context">
      <header className="section-head">
        <div>
          <span className="eyebrow">PRICE RISK</span>
          <h3>Risk behind the price action</h3>
          <p>{t.observations} completed daily observations.</p>
        </div>
      </header>
      <div className="timing-metrics">
        {metrics.map((m) => (
          <div key={m.label}>
            <span>
              {m.label}{" "}
              <Help label={m.label}>
                <p>{m.help}</p>
              </Help>
            </span>
            <strong className={`metric-tone-${m.tone}`}>{m.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
