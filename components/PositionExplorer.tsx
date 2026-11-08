"use client";
import { useState, useId } from "react";
import { SlidersHorizontal, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useProduct } from "./Session";
import { useWorkspaceQuotes } from "./useWorkspaceQuotes";
import { portfolioTotals } from "@/lib/engine";
import {
  explorePosition,
  positionFundingReview,
} from "@/lib/position-explorer";
import { researchEdge } from "@/lib/edge-research";
import { amount, percent, dateLabel } from "@/lib/format";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import type { Research } from "@/lib/types";

export default function PositionExplorer({
  research: r,
  reading,
}: {
  research: Research;
  reading: ReturnType<typeof researchEdge>;
}) {
  const { preferences } = useWorkspacePreferences();
  const { workspace, workspaceError, demo } = useProduct(),
    quotes = useWorkspaceQuotes("portfolio");
  const q = Object.fromEntries(
    Object.entries(quotes.data).flatMap(([s, row]) =>
      row.quote ? [[s, row.quote]] : [],
    ),
  );
  q[r.company.symbol] = r.quote;
  const positions = workspace?.positions ?? [];
  const totals = portfolioTotals(positions, q);
  const quantity = positions
    .filter(
      (p) =>
        p.symbol === r.company.symbol &&
        p.assetType !== "cash" &&
        Number.isFinite(p.cost) &&
        p.cost >= 0 &&
        Number.isFinite(p.quantity) &&
        p.quantity > 0,
    )
    .reduce((n, p) => n + p.quantity, 0);
  const usable =
    r.quote.currency === "USD" &&
    r.quote.price != null &&
    Number.isFinite(r.quote.price) &&
    r.quote.price > 0;
  const current = usable ? quantity * r.quote.price! : 0;
  const actualWeight =
    totals.knownValue > 0 ? (current / totals.knownValue) * 100 : 0;
  const [selected, setSelected] = useState<number | null>(null);
  const weight = selected ?? Math.min(100, Math.max(0, actualWeight));
  const scenario = reading.brief.scenarioEligible
    ? reading.brief.scenario
    : null;
  const result = explorePosition({
    portfolioValue: totals.knownValue,
    currentValue: current,
    price: usable ? r.quote.price : null,
    weight,
    bearPrice: scenario?.currency === "USD" ? scenario.low : null,
  });
  const cash = positions
    .filter(
      (p) =>
        p.assetType === "cash" &&
        p.symbol === "USD" &&
        p.currency === "USD" &&
        Number.isFinite(p.quantity) &&
        p.quantity > 0 &&
        Number.isFinite(p.cost) &&
        p.cost >= 0,
    )
    .reduce((sum, p) => sum + p.quantity, 0);
  const complete =
    !!workspace &&
    !workspaceError &&
    !quotes.loading &&
    !totals.missing.length &&
    positions.every((p) => p.assetType === "cash" || !q[p.symbol]?.stale) &&
    !r.quote.stale;
  const funding = result.available
    ? positionFundingReview({
        portfolioValue: totals.knownValue,
        currentValue: current,
        targetValue: result.targetValue,
        cash,
        complete,
        concentrationLimit: preferences.concentrationLimit,
      })
    : { available: false as const };
  const id = useId(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <section className="position-explorer" aria-labelledby={id}>
      <header>
        <span className="experience-kicker">
          <SlidersHorizontal size={15} /> MAKE IT PERSONAL
        </span>
        <h3 id={id}>What would this position mean?</h3>
        <p>Explore the exposure before deciding.</p>
      </header>
      {result.available ? (
        <>
          <div className="position-weight">
            <label htmlFor={`${id}-weight`}>Hypothetical allocation</label>
            <output htmlFor={`${id}-weight`}>
              {weight.toFixed(1)}
              <small>%</small>
            </output>
          </div>
          <input
            id={`${id}-weight`}
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={weight}
            onChange={(e) => setSelected(Number(e.target.value))}
            aria-describedby={`${id}-basis`}
          />
          <div
            className="position-presets"
            role="group"
            aria-label="Explore allocation"
          >
            <span>Try a weight</span>
            {[1, 2, 5, 10].map((v) => (
              <button
                key={v}
                aria-pressed={weight === v}
                onClick={() => setSelected(v)}
              >
                {v}%
              </button>
            ))}
          </div>
          <dl className="position-outputs">
            <div>
              <dt>Position value</dt>
              <dd>{amount(result.targetValue)}</dd>
            </div>
            <div>
              <dt>
                {result.valueDifference >= 0
                  ? "Above current holding"
                  : "Below current holding"}
              </dt>
              <dd>{amount(Math.abs(result.valueDifference))}</dd>
            </div>
          </dl>
          <p className="experience-caption">
            Business assessment: <strong>{reading.assessment}</strong>. Changing
            this weight does not change the business or price assessment.
          </p>
          {funding.available ? (
            <div className="position-scenario">
              <span>
                {result.valueDifference < 0
                  ? "Trim proceeds stay in recorded cash"
                  : "Funding and concentration review"}
              </span>
              <p>
                {funding.shortfall > 0
                  ? `${amount(funding.shortfall)} beyond recorded USD cash; another funding source would be needed.`
                  : `${amount(funding.cashAfter)} recorded USD cash after this hypothetical change.`}
              </p>
              {funding.afterInvestmentWeight != null && (
                <p>
                  {percent(funding.afterInvestmentWeight)} of priced investments
                  after the change (cash excluded).
                  {funding.exceedsLimit === true
                    ? ` Above your ${preferences.concentrationLimit}% attention threshold; review size before adding.`
                    : funding.exceedsLimit === false
                      ? ` Within your ${preferences.concentrationLimit}% attention threshold.`
                      : " No personal concentration threshold set."}
                </p>
              )}
              <small>
                Recorded cash is not confirmed buying power. Fees, taxes,
                settlement and other commitments are not modeled.
              </small>
            </div>
          ) : (
            <p className="experience-caption">
              Funding review needs complete, non-stale USD holding prices. Any
              displayed weight uses the priced portion only.
            </p>
          )}
          {result.scenarioChange != null && (
            <div className="position-scenario">
              <span>In the Bear sensitivity</span>
              <strong
                className={result.scenarioChange < 0 ? "negative" : "positive"}
              >
                {amount(result.scenarioChange)}{" "}
                <small>
                  ({percent(result.portfolioImpact, true)} of this base)
                </small>
              </strong>
            </div>
          )}
          <p id={`${id}-basis`} className="experience-caption">
            Base: {amount(totals.knownValue)} in priced USD holdings and
            recorded cash.{" "}
            {totals.missing.length > 0
              ? `${totals.missing.length} unpriced holding(s) excluded. `
              : ""}
            Managed balances and margin are excluded. Reference{" "}
            {dateLabel(r.quote.asOf)}
            {r.quote.stale ? " · older quote" : ""}. Reallocation within this
            fixed base; no new cash assumed. ETF look-through overlap and
            benchmark attribution are not included.
          </p>
          <button className="text-button" onClick={() => setSelected(null)}>
            Reset to current exposure
          </button>
        </>
      ) : (
        <div className="position-empty">
          <p>
            Add priced USD holdings to explore how a position changes your
            exposure.
          </p>
          <Link className="button" href={`${prefix}/portfolio`}>
            Open portfolio <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <small className="experience-caption">
        Your chosen scenario, not a suggested weight. No order is placed.
      </small>
    </section>
  );
}
