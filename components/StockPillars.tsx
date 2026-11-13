"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import type { aurynDecision } from "@/lib/auryn-decision";
import { stockPillars } from "@/lib/stock-pillars";
import { priceAmount, percent } from "@/lib/format";
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
  if (!view) return null;
  return (
    <section
      className={s.root}
      aria-label={casesOnly ? "Bear, base and bull" : "The case in plain words"}
    >
      <header>
        <span className={s.eyebrow}>Valuation scenarios</span>
        <h2>Bear, base &amp; bull</h2>
      </header>
      {view.cases && (
        <div className={s.cases}>
          {(["bear", "base", "bull"] as const).map((name) => {
            const c = view.cases!;
            return (
              <div key={name} data-case={name}>
                <small>{name[0].toUpperCase() + name.slice(1)} case</small>
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
            {view.cases.position === "above-bull"
              ? " · the price is above even the bull case."
              : view.cases.position === "below-bear"
                ? " · the price is below even the bear case."
                : "."}
          </p>
        </div>
      )}
      {!view.cases && (
        <p>More company evidence is needed for a supported scenario range.</p>
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
                <div>
                  <small>{p.question}</small>
                  <strong>{p.answer}</strong>
                  <p>{p.why}</p>
                </div>
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
