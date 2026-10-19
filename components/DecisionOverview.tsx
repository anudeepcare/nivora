"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { researchBrief } from "@/lib/research-brief";
import { dateLabel, amount, percent } from "@/lib/format";
import PositionAwareResearch from "./PositionAwareResearch";
export default function DecisionOverview({
  research: r,
  onTab,
}: {
  research: Research;
  onTab: (tab: "Thesis" | "Valuation" | "Technicals" | "News") => void;
}) {
  const b = useMemo(() => researchBrief(r), [r]);
  return (
    <section className="decision-readout" aria-label="Decision and evidence">
      <header>
        <div>
          <span className="eyebrow">Business · Price · Discipline</span>
          <h2>Understand the case. Then consider the price.</h2>
        </div>
        <small>
          {b.period
            ? `Reported through ${dateLabel(b.period)}`
            : "Reporting evidence incomplete"}
        </small>
      </header>
      <div className="decision-readout-grid">
        {[
          {
            id: "business",
            label: "The business",
            ...b.business,
            tab: "Thesis" as const,
          },
          {
            id: "value",
            label: "The valuation",
            ...b.value,
            tab: "Valuation" as const,
          },
          {
            id: "accumulation",
            label: "The contribution condition",
            ...b.accumulation,
            tab: "Technicals" as const,
          },
        ].map((x) => (
          <button
            type="button"
            key={x.id}
            data-lens={x.id}
            onClick={() => onTab(x.tab)}
          >
            <span>{x.label} ↗</span>
            <strong>{x.title}</strong>
            <p>{x.reason}</p>
            {x.id === "business" &&
              b.coverage.family === "operating-company" && (
                <div className="decision-number-line">
                  <span>
                    Revenue growth{" "}
                    <b>
                      {b.businessNumbers.revenueGrowth == null
                        ? "—"
                        : percent(b.businessNumbers.revenueGrowth)}
                    </b>
                  </span>
                  <span>
                    Cash after capex{" "}
                    <b>
                      {amount(
                        b.businessNumbers.fcf,
                        b.businessNumbers.currency,
                        true,
                      )}
                    </b>
                  </span>
                </div>
              )}
            {x.id === "value" && b.scenario && (
              <div className="decision-number-line">
                <span>
                  Conditional base{" "}
                  <b>{amount(b.scenario.base, b.scenario.currency)}</b>
                </span>
                <span>
                  Bear–Bull{" "}
                  <b>
                    {amount(b.scenario.low, b.scenario.currency, true)}–
                    {amount(b.scenario.high, b.scenario.currency, true)}
                  </b>
                </span>
              </div>
            )}
            {x.id === "accumulation" && b.accumulation.month && (
              <small>
                {b.accumulation.month} · confirmed · price-only experimental
                rule
              </small>
            )}
          </button>
        ))}
      </div>
      <aside
        className={
          b.conflicting
            ? "decision-readout-risk conflict"
            : "decision-readout-risk"
        }
      >
        <b>
          {b.conflicting
            ? "Resolve conflicting inputs"
            : "Keep this risk in view"}
        </b>
        <span>
          {b.conflicting
            ? "Check listing units, share count and observation dates before using scenario prices."
            : b.risk}
        </span>
      </aside>
      <PositionAwareResearch research={r} compact />
      <details className="decision-evidence">
        <summary>Why this assessment · {b.metrics} available metrics</summary>
        <div className="decision-evidence-grid">
          {b.checks.map((x) => (
            <article key={x.label} data-status={x.status}>
              <span>
                {x.status === "available"
                  ? "Available"
                  : x.status === "conflicting"
                    ? "Conflicting"
                    : "Incomplete"}
              </span>
              <h3>{x.label}</h3>
              <p>{x.detail}</p>
            </article>
          ))}
        </div>
        {b.support.length > 0 && (
          <p>
            <b>Supporting evidence:</b> {b.support.join(" · ")}
          </p>
        )}
        {b.counterCase.length > 0 && (
          <p>
            <b>Counter-case:</b> {b.counterCase.join(" · ")}
          </p>
        )}
        <small>
          Rules {b.version} · {b.decisionVersion}. Consistency checks are not
          independently verified facts. Analyst consensus is separate from
          modelled value.
        </small>
      </details>
    </section>
  );
}
