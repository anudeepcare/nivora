"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Research } from "@/lib/types";
import { decisionEvidence, impliedExpectations } from "@/lib/decision-tools";
import { listingReconciliation } from "@/lib/listing-reconciliation";
import { targetsEstimates } from "@/lib/targets-estimates";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import s from "./DecisionInsights.module.css";
export default function DecisionInsights({
  research,
  owns = false,
  now,
  prefix = "",
}: {
  research: Research;
  owns?: boolean;
  now: number;
  prefix?: string;
}) {
  return (
    <Insights
      key={research.company.symbol}
      research={research}
      owns={owns}
      now={now}
      prefix={prefix}
    />
  );
}
function Insights({
  research: r,
  owns,
  now,
  prefix,
}: {
  research: Research;
  owns: boolean;
  now: number;
  prefix: string;
}) {
  const [tab, setTab] = useState(0),
    [multiple, setMultiple] = useState("25"),
    [desired, setDesired] = useState("8"),
    [horizon, setHorizon] = useState("");
  const e = useMemo(() => decisionEvidence(r, owns, now), [r, owns, now]);
  const model = useMemo(
    () =>
      targetsEstimates({ ...r, priceObservedAt: new Date(now).toISOString() }),
    [r, now],
  );
  const estimates = model.estimates.filter(
    (x) => Date.parse(x.date) > now && x.currency === r.quote.currency,
  );
  const initial = estimates.reduce<(typeof estimates)[number] | null>(
    (a, b) =>
      !a ||
      Math.abs(Date.parse(b.date) - now - 3 * 365.25 * 86400000) <
        Math.abs(Date.parse(a.date) - now - 3 * 365.25 * 86400000)
        ? b
        : a,
    null,
  );
  const selection = horizon || initial?.date || "years:3";
  const estimate = estimates.find((x) => x.date === selection);
  const comparableListing =
    !r.company.foreignListing ||
    listingReconciliation(r).status === "available";
  const years = selection.startsWith("years:")
    ? Number(selection.split(":")[1])
    : (Date.parse(selection) - now) / (365.25 * 86400000);
  const stamp = Date.parse(r.quote.asOf ?? "");
  const usable =
    Number.isFinite(stamp) &&
    stamp <= now + 60000 &&
    now - stamp <= 4 * 86400000 &&
    r.company.assetType === "stock" &&
    r.company.currency === r.quote.currency;
  const result =
    usable && multiple.trim() && desired.trim()
      ? impliedExpectations({
          price: r.quote.price ?? 0,
          eps: comparableListing ? (estimate?.eps ?? null) : null,
          years,
          multiple: Number(multiple),
          annualReturn: Number(desired),
        })
      : null;
  const d = e.decision;
  return (
    <section className={s.root} aria-label="Decision insights">
      <header>
        <div>
          <span className="eyebrow">THE REASONS BEHIND COMPANY COMPARISON</span>
          <h2>Investment context</h2>
        </div>
        <Help label="How to use decision insights">
          <p>
            Price opportunity, business evidence and portfolio fit answer
            different questions. These views connect the available evidence
            without combining it into a promised return or an automatic trading
            instruction.
          </p>
        </Help>
      </header>
      <div
        className={s.tabs}
        role="group"
        aria-label="Choose a decision question"
      >
        {["Business & price", "Price expectations", "Earnings & next step"].map(
          (name, i) => (
            <button
              key={name}
              aria-pressed={tab === i}
              onClick={() => setTab(i)}
            >
              {name}
            </button>
          ),
        )}
      </div>
      {tab === 0 && (
        <div className={s.panel}>
          <h3>{e.headline}</h3>
          <div className={s.evidence}>
            <div>
              <Help label="Price weakness" trigger="Price context">
                <p>
                  Distance below the highest observed closing price in the
                  trailing year, using available historical closes. A lower
                  price alone does not establish undervaluation. Short histories
                  are explicitly identified.
                </p>
              </Help>
              <strong>
                {e.price.drawdown == null
                  ? "History pending"
                  : percent(e.price.drawdown)}
              </strong>
              <p>
                Below {e.price.completeYear ? "52-week" : "available-history"}{" "}
                closing high · {dateLabel(e.price.asOf)}
              </p>
            </div>
            <div>
              <Help label="Business evidence" trigger="Business evidence">
                <p>
                  The existing AURYN business rules assess comparable financial
                  reports, funding and risks. Missing reports produce an
                  incomplete assessment, not a failing grade.
                </p>
              </Help>
              <strong>
                {
                  {
                    strong: "Supported",
                    developing: "Developing",
                    weak: "Concerns",
                    missing: "Incomplete",
                  }[d.business]
                }
              </strong>
              <p>Financial period {dateLabel(d.period)}</p>
            </div>
            <div>
              <Help label="Valuation context" trigger="Valuation context">
                <p>
                  This uses the existing conditional valuation assessment. A
                  strong business and a favourable price zone do not guarantee
                  an attractive valuation. Review the model and its assumptions.
                </p>
              </Help>
              <strong>
                {
                  {
                    attractive: "Attractive",
                    fair: "Within model range",
                    expensive: "Demanding",
                    unassessed: "Needs assumptions",
                  }[d.value]
                }
              </strong>
              <p>{d.horizon}</p>
            </div>
          </div>
          <p>{d.explanation.detail}</p>
          {d.risks.length > 0 && (
            <p className={s.caution}>
              <b>Keep in view:</b> {d.risks[0]}
            </p>
          )}
          <Link
            href={`${prefix}/research/${encodeURIComponent(r.company.symbol)}?tab=Financials`}
          >
            Explore the business evidence →
          </Link>
        </div>
      )}
      {tab === 1 && (
        <div className={s.panel}>
          <h3>What would today’s price require?</h3>
          <p>
            Choose a horizon, future P/E and desired annual price return. See
            the earnings per share needed to support those assumptions.
          </p>
          <div className={s.inputs}>
            <label>
              Horizon
              <select
                value={selection}
                onChange={(e) => setHorizon(e.target.value)}
              >
                {estimates.map((x) => (
                  <option key={x.date} value={x.date}>
                    Fiscal year ending {x.date}
                  </option>
                ))}
                {[1, 3, 5].map((y) => (
                  <option key={y} value={`years:${y}`}>
                    {y} years · custom horizon
                  </option>
                ))}
              </select>
            </label>
            <label>
              Future P/E assumption
              <input
                inputMode="decimal"
                type="number"
                min="1"
                max="200"
                step="1"
                value={multiple}
                onChange={(e) => setMultiple(e.target.value)}
              />
            </label>
            <label>
              Desired annual price return (%)
              <input
                inputMode="decimal"
                type="number"
                min="-99"
                max="100"
                value={desired}
                onChange={(e) => setDesired(e.target.value)}
              />
            </label>
          </div>
          {result ? (
            <>
              <div className={s.answer} aria-live="polite">
                <span>Required EPS at this horizon</span>
                <strong>{amount(result.requiredEps, r.quote.currency)}</strong>
                <p>
                  To support {amount(result.requiredPrice, r.quote.currency)} at{" "}
                  {multiple}× P/E over {years.toFixed(1)} years.
                </p>
              </div>
              {estimate && result.gapPercent != null && (
                <div
                  className={s.estimatePair}
                  aria-label="Same-period EPS comparison"
                >
                  <div>
                    <span>Required EPS</span>
                    <strong>
                      {amount(result.requiredEps, r.quote.currency)}
                    </strong>
                  </div>
                  <div>
                    <span>Supplied estimate</span>
                    <strong>{amount(estimate.eps, r.quote.currency)}</strong>
                  </div>
                </div>
              )}
              {estimate && (
                <p className={s.comparison}>
                  {result.gapPercent == null
                    ? "A positive EPS estimate on a reconciled listing basis is unavailable."
                    : `${percent(result.gapPercent, true)} versus the supplied EPS estimate of ${amount(estimate.eps, r.quote.currency)} for the same fiscal end.`}{" "}
                  Dataset {dateLabel(model.asOf)}. Accounting and share bases
                  must be checked before relying on this comparison.
                </p>
              )}
              <details>
                <summary>Assumptions & calculation</summary>
                <p>
                  Required EPS = reference price × (1 + desired annual return) ^
                  years ÷ assumed future P/E. Initial 25× and 8% are editable
                  illustration assumptions, not AURYN forecasts. Excludes
                  dividends, dilution changes, tax and trading costs. A custom
                  horizon has no matched analyst forecast.
                </p>
                <p>
                  {r.quote.stale ? "Older dated reference" : "Reference"}{" "}
                  {amount(r.quote.price, r.quote.currency)} ·{" "}
                  {dateLabel(r.quote.asOf)}. A multiple is not a forecast
                  probability.
                </p>
              </details>
            </>
          ) : (
            <p role="status">
              A recent comparable stock quote and valid assumptions are needed.
              P/E must be above zero and at most 200; annual return must be
              above −100% and at most 100%.
            </p>
          )}
        </div>
      )}
      {tab === 2 && (
        <div className={s.panel}>
          <h3>Did the evidence change the case?</h3>
          {e.report ? (
            <p>
              <b>{e.report.label}</b> · {dateLabel(e.report.date)}. EPS{" "}
              {e.report.actual ?? "pending"} versus estimate{" "}
              {e.report.estimate ?? "unavailable"}.
            </p>
          ) : (
            <p>No reported earnings result is available in this snapshot.</p>
          )}
          <p>
            Financial comparisons through {dateLabel(e.period)} may predate the
            earnings release. An EPS beat alone does not confirm guidance or
            your investment case.
          </p>
          {e.changes.length > 0 && (
            <ul className={s.checklist}>
              {e.changes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          <h4>What to wait for or revisit</h4>
          <ul className={s.checklist}>
            {d.changeConditions.slice(0, 3).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className={s.links}>
            <Link
              href={`${prefix}/research/${encodeURIComponent(r.company.symbol)}?tab=News`}
            >
              Review earnings & sources →
            </Link>
            <Link
              href={`${prefix}/alerts?symbol=${encodeURIComponent(r.company.symbol)}`}
            >
              Set an alert →
            </Link>
          </div>
          <small>
            Business conditions are review prompts. Alerts only monitor
            supported rule types when checks run; these prompts are not
            automatically monitored.
          </small>
        </div>
      )}
    </section>
  );
}
