"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { decisionGuide } from "@/lib/decision-guide";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";

export default function DecisionBrief({
  research: r,
  onDca,
}: {
  research: Research;
  onDca: () => void;
}) {
  const p = useMemo(() => perspective(r), [r]),
    d = useMemo(() => decisionGuide(r, p), [r, p]),
    crypto = r.company.assetType === "crypto";
  const metrics = crypto
    ? [
        {
          label: "50-day average",
          value: amount(p.tech.ma50, r.quote.currency),
          detail: "Completed daily closes",
        },
        {
          label: "200-day average",
          value: amount(p.tech.ma200, r.quote.currency),
          detail: "Long-term price reference",
        },
        {
          label: "RSI · 14",
          value: p.tech.rsi?.toFixed(1) ?? "—",
          detail: "Momentum, not fair value",
        },
        {
          label: "Price trend",
          value: p.tech.trend,
          detail: dateLabel(p.tech.last),
        },
      ]
    : [
        {
          label: `Revenue · ${p.periodBasis}`,
          value: amount(p.last?.revenue, p.last?.currency, true),
          detail:
            p.growth == null
              ? "Comparable growth unavailable"
              : `${percent(p.growth, true)} year over year`,
        },
        {
          label: `Net income · ${p.periodBasis}`,
          value: amount(p.last?.netIncome, p.last?.currency, true),
          detail: p.business,
        },
        {
          label: "Cash after capex",
          value: amount(p.last?.fcf, p.last?.currency, true),
          detail: "Operating cash flow − capex",
        },
        {
          label: "Price trend",
          value: p.tech.trend,
          detail: dateLabel(p.tech.last),
        },
      ];
  return (
    <section
      className="au-decisionbrief"
      aria-label="Investment decision guide"
    >
      <header className="au-between">
        <span className="au-eyebrow">At a glance · long-term research</span>
        <div className="au-brief-tools">
          {p.dca.confirmed && (
            <button
              className="au-dca-shortcut"
              onClick={onDca}
              aria-label="View monthly DCA signals"
            >
              <b>{p.dca.confirmed.multiplier}×</b> DCA · price only
            </button>
          )}
          <Help label="How action labels work">
            AURYN’s original research rules, not trade instructions. Buy
            candidate requires current positive profit and cash generation,
            revenue growth and an aligned price trend. It does not establish
            fair value. Trim review flags a confirmed extended monthly price
            with elevated RSI. Sell review flags losses and cash outflows in two
            comparable periods with falling revenue. Specialist businesses and
            incomplete evidence are reviewed separately. No performance
            advantage has been validated. Your allocation, taxes and investment
            thesis still matter.
          </Help>
        </div>
      </header>
      <div className="au-actions-overview">
        {[
          { label: "Considering a buy", action: d.buying },
          { label: "If you already own it", action: d.owning },
        ].map(({ label, action }) => (
          <div
            key={label}
            className="au-action-summary"
            data-tone={action.tone}
          >
            <small>{label}</small>
            <h2>
              <i aria-hidden="true" />
              {action.label}
            </h2>
            <p>{action.reason}</p>
          </div>
        ))}
      </div>
      <div className="au-evidence-strip">
        {metrics.map((m) => (
          <div key={m.label}>
            <small>{m.label}</small>
            <strong
              className={
                m.label === "Price trend"
                  ? p.tech.trend === "Constructive"
                    ? "au-positive"
                    : p.tech.trend === "Weak"
                      ? "au-amber"
                      : ""
                  : ""
              }
            >
              {m.value}
            </strong>
            <span>{m.detail}</span>
          </div>
        ))}
      </div>
      {!crypto && (
        <p className="au-evidence-date">
          {p.periodBasis} to {dateLabel(p.last?.end)} ·{" "}
          {p.last?.currency ?? "Reporting currency unavailable"} · Valuation
          assumptions remain separate
        </p>
      )}
    </section>
  );
}
