import type { ReactNode } from "react";
import type { revenueSensitivity } from "@/lib/revenue-sensitivity";
import { amount, dateLabel, percent } from "@/lib/format";
import s from "./SelectedValuation.module.css";

type Available = Extract<
  ReturnType<typeof revenueSensitivity>,
  { available: true }
>;
export default function RevenueSensitivityCases({
  scenario,
  actions,
}: {
  scenario: Available;
  actions?: ReactNode;
}) {
  return (
    <section
      className={s.root}
      aria-label="Selected AURYN valuation model"
      data-model="revenue-sensitivity"
    >
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>Market expectations</span>
          <h2>Bear, base &amp; bull</h2>
          <p>
            Price-anchored revenue sensitivity · {dateLabel(scenario.end)} · not
            fair value or a price forecast.
          </p>
        </div>
        {actions}
      </header>
      <div className={s.reasons}>
        {scenario.cases.map((c) => (
          <div className={s.case} key={c.name} data-case={c.name.toLowerCase()}>
            <span className={s.caseLabel}>{c.name} scenario</span>
            <strong>{amount(c.target, scenario.reference.currency)}</strong>
            <small className={c.change < 0 ? "negative" : undefined}>
              {percent(c.change, true)}
            </small>
            <p className={s.caseInput}>
              Revenue {amount(c.revenue, scenario.estimateCurrency, true)} ·{" "}
              {c.relativePricingStress.toFixed(1)}× relative pricing
            </p>
          </div>
        ))}
      </div>
      <p>
        Base holds today’s reference price constant. Bear and bull stress the
        supplied revenue range and relative pricing by −20% / +20%; they are not
        probabilities.
      </p>
      <details>
        <summary>Revenue evidence &amp; assumptions</summary>
        <p>
          Forecast mean{" "}
          {amount(scenario.anchorRevenue, scenario.estimateCurrency, true)} ·
          fiscal end {dateLabel(scenario.end)} · dataset{" "}
          {dateLabel(scenario.asOf)}.
        </p>
        <p>
          Reference{" "}
          {amount(scenario.reference.price, scenario.reference.currency)} ·{" "}
          {dateLabel(scenario.reference.asOf)} · {scenario.reference.basis}.
        </p>
        <p>{scenario.caveat}</p>
      </details>
    </section>
  );
}
