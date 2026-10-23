"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import PriceRiskCases from "./PriceRiskCases";
import { researchOutlook } from "@/lib/outlook";
import { researchBrief } from "@/lib/research-brief";
import { amount, percent, dateLabel } from "@/lib/format";
export default function ScenarioCompass({
  research: r,
}: {
  research: Research;
}) {
  const forecast = useMemo(() => researchOutlook(r), [r]);
  const checks = useMemo(() => researchBrief(r), [r]);
  const [selected, setSelected] = useState(1);
  const supported =
    forecast.available && forecast.basis === "earnings" && !checks.conflicting;
  const cases = supported ? forecast.cases : [];
  const active = cases[selected] ?? cases[0];
  const current = r.quote.price;
  const values = [
    ...cases.map((c) => c.target),
    ...(current != null && Number.isFinite(current) && current > 0
      ? [current]
      : []),
  ];
  const lo = values.length ? Math.min(...values) * 0.85 : 0,
    hi = values.length ? Math.max(...values) * 1.1 : 1;
  const point = (v: number) =>
    Math.min(100, Math.max(0, ((v - lo) / Math.max(1e-9, hi - lo)) * 100));
  return (
    <section className="scenario-compass" aria-label="Scenario compass">
      <header>
        <div>
          <span className="eyebrow">Separate the price from the story</span>
          <h3>
            {supported
              ? forecast.basis === "revenue"
                ? "Revenue sensitivity"
                : "Earnings scenarios"
              : checks.priceRisk.available
                ? "Bear, base & bull · price risk"
                : "Evidence before a price target"}
          </h3>
        </div>
        <div className="compass-quote">
          <span>{r.quote.stale ? "Older quote" : "Reference price"}</span>
          <strong>{amount(current, r.quote.currency)}</strong>
          <small>{dateLabel(r.quote.asOf)}</small>
        </div>
      </header>
      {supported && active ? (
        <>
          <p className="compass-horizon">
            Annual forecast ends {dateLabel(forecast.end)} ·{" "}
            {Math.round(forecast.years * 12)} months ahead. Conditional
            estimates, not intrinsic fair value.
          </p>
          <div
            className="compass-cases"
            role="group"
            aria-label="Explore scenario assumptions"
          >
            {cases.map((c, i) => (
              <button
                type="button"
                key={c.name}
                data-case={c.name}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span>{c.name}</span>
                <strong>{amount(c.target, forecast.currency)}</strong>
                <small>
                  {current != null
                    ? percent(c.change, true)
                    : "Quote needed for price change"}
                </small>
              </button>
            ))}
          </div>
          <div
            className="compass-axis"
            aria-label="Scenario values and reference quote on one linear price scale"
          >
            <div className="compass-track" />
            {cases.map((c) => (
              <span
                key={c.name}
                data-case={c.name}
                style={{ left: `${point(c.target)}%` }}
                title={`${c.name}: ${amount(c.target, forecast.currency)}`}
              />
            ))}
            {current != null && current > 0 && (
              <i
                style={{ left: `${point(current)}%` }}
                title={`Reference: ${amount(current, r.quote.currency)}`}
              />
            )}
          </div>
          <div className="compass-selected" aria-live="polite">
            <div>
              <span>
                {active.name} case ·{" "}
                {forecast.basis === "revenue"
                  ? "Revenue × EV / revenue"
                  : "EPS × P/E"}
              </span>
              <strong>{active.multiple.toFixed(1)}× exit multiple</strong>
            </div>
            <div>
              <span>
                {forecast.basis === "revenue"
                  ? "Forecast revenue"
                  : "Forecast EPS"}
              </span>
              <strong>
                {amount(
                  forecast.basis === "revenue" ? active.revenue : active.eps,
                  forecast.currency,
                  forecast.basis === "revenue",
                )}
              </strong>
            </div>
            <div>
              <span>
                {forecast.basis === "revenue"
                  ? "Additional dilution assumption"
                  : "Annualized price change"}
              </span>
              <strong>
                {forecast.basis === "revenue"
                  ? percent(active.dilution)
                  : percent(active.annual, true)}
              </strong>
            </div>
          </div>
          <p className="desk-footnote">
            {forecast.basis === "revenue"
              ? "Net debt is held constant. Future capex, financing and delivery of planned capacity are not modeled; this sensitivity can substantially overstate equity value."
              : "Multiples are explicit stress assumptions around reported forward P/E. Fees, dividends, taxes and future revisions are excluded."}{" "}
            Forecast observations: {dateLabel(forecast.asOf)}.
            {forecast.caveat ? ` ${forecast.caveat}` : ""}
          </p>
        </>
      ) : checks.priceRisk.available ? (
        <PriceRiskCases scenarios={checks.priceRisk} />
      ) : (
        <p className="compass-unavailable">
          {checks.priceRisk.available ? "" : checks.priceRisk.reason}
        </p>
      )}
    </section>
  );
}
