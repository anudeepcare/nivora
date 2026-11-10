"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import type { aurynDecision } from "@/lib/auryn-decision";
import { stockPillars } from "@/lib/stock-pillars";
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
}: {
  research: Research;
  decision: ReturnType<typeof aurynDecision>;
}) {
  const view = useMemo(
    () => stockPillars(research, decision),
    [research, decision],
  );
  if (!view) return null;
  return (
    <section className={s.root} aria-label="The case in plain words">
      <header>
        <span className={s.eyebrow}>The case in plain words</span>
        <h2>
          {decision.actionLabel}
          {decision.headline ? ` — ${decision.headline}` : ""}
        </h2>
        <p>{view.summary}</p>
      </header>
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
        price history. They are not added into a score: one weak answer can
        outweigh several good ones. Not a recommendation.
      </p>
    </section>
  );
}
