"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import type { aurynDecision } from "@/lib/auryn-decision";
import { stockPillars } from "@/lib/stock-pillars";
import { priceAmount, percent, dateLabel } from "@/lib/format";
import { consensusOutlook } from "@/lib/outlook";
import s from "./StockPillars.module.css";

const mark = {
  supportive: "Yes",
  mixed: "Partly",
  caution: "Careful",
  unknown: "?",
};
/** The case in plain words: six questions, each with an answer and its reason. */
export default function StockPillars({
  research,
  decision,
  casesOnly = false,
}: {
  casesOnly?: boolean;
  research: Research;
  decision: ReturnType<typeof aurynDecision>;
}) {
  const view = useMemo(
    () => stockPillars(research, decision),
    [research, decision],
  );
  const consensus = useMemo(() => consensusOutlook(research), [research]);
  if (!view) return null;
  const analystRange = view.cases?.kind === "analyst";
  const rangeTitle = analystRange
    ? "Analyst target range"
    : "Bear, base & bull";
  return (
    <section
      className={s.root}
      aria-label={casesOnly ? rangeTitle : "The case in plain words"}
    >
      <header>
        <span className={s.eyebrow}>
          {analystRange ? "Analyst opinion" : "Conditional valuation"}
        </span>
        <h2>{rangeTitle}</h2>
      </header>
      {view.cases && (
        <div className={s.cases}>
          {(["bear", "base", "bull"] as const).map((name) => {
            const c = view.cases!;
            return (
              <div key={name} data-case={name}>
                <small>
                  {analystRange
                    ? {
                        bear: "Low target",
                        base: "Consensus",
                        bull: "High target",
                      }[name]
                    : `${name[0].toUpperCase() + name.slice(1)} case`}
                </small>
                <strong>{priceAmount(c[name], c.currency)}</strong>
                {c.price != null && (
                  <span>{percent((c[name] / c.price - 1) * 100, true)}</span>
                )}
              </div>
            );
          })}
          <p>
            {view.cases.source}
            {view.cases.price != null
              ? ` · ${view.cases.referenceBasis === "settled-close" ? "settled close" : "quote"} ${priceAmount(view.cases.price, view.cases.currency)}`
              : ""}
            {analystRange && consensus?.referenceAsOf
              ? ` · ${dateLabel(consensus.referenceAsOf)}`
              : ""}
            {view.cases.position === "above-bull"
              ? analystRange
                ? " · the price is above the high analyst target."
                : " · the price is above even the bull case."
              : view.cases.position === "below-bear"
                ? analystRange
                  ? " · the price is below the low analyst target."
                  : " · the price is below even the bear case."
                : "."}
          </p>
          {analystRange && (
            <p>
              {consensus?.analysts != null
                ? `${consensus.analysts} analysts · `
                : ""}
              Analyst opinion, not AURYN fair value or a promised return;
              individual target revision dates and forecast horizon are not
              supplied. Conditional models and historical price risk are
              separate views.
            </p>
          )}
        </div>
      )}
      {!view.cases && (
        <div className={s.cases} aria-label="Scenario evidence unavailable">
          {(["bear", "base", "bull"] as const).map((name) => (
            <div key={name} data-case={name}>
              <small>{name[0].toUpperCase() + name.slice(1)} case</small>
              <strong className={s.unavailable}>Not available</strong>
            </div>
          ))}
          <details className={s.unavailableReason}>
            <summary>Why scenarios are unavailable</summary>
            <p role="status">{view.casesUnavailableReason}</p>
          </details>
        </div>
      )}
      {!casesOnly && (
        <details className={s.details}>
          <summary>Business checks &amp; historical context</summary>
          <p>{view.summary}</p>
          {view.odds && (
            <div className={s.odds} data-grade={view.odds.grade}>
              <strong>{view.odds.headline}</strong>
              <p>{view.odds.detail}</p>
            </div>
          )}
          {view.exitWatch && (
            <p className={s.exit} role="note" data-level={view.exitWatch.level}>
              {view.exitWatch.text}
            </p>
          )}
          <ul className={s.list}>
            {view.pillars.map((p) => (
              <li key={p.id} data-status={p.status}>
                <span className={s.badge}>{mark[p.status]}</span>
                <details className={s.pillarDetail}>
                  <summary>
                    <small>{p.question}</small>
                    <strong>{p.answer}</strong>
                  </summary>
                  <p>{p.why}</p>
                </details>
              </li>
            ))}
          </ul>
          <p className={s.note}>
            Six separate checks from reported financials, analyst estimates and
            price history. The record is what happened to similar cases among
            1,305 US stocks; it describes the past and is not a forecast for
            this stock. They are not added into a score: one weak answer can
            outweigh several good ones. Not a recommendation.
          </p>
        </details>
      )}
    </section>
  );
}
