"use client";
import type { aurynDecision } from "@/lib/auryn-decision";
import type { EvidenceSection } from "@/lib/approved-research";
import { dateLabel } from "@/lib/format";
import s from "./AssessmentSummary.module.css";

export default function AssessmentSummary({
  decision: d,
  onTab,
}: {
  decision: ReturnType<typeof aurynDecision>;
  onTab: (tab: EvidenceSection) => void;
}) {
  return (
    <section className={s.root} aria-label="Your research summary">
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>AURYN assessment</span>
          <h2>{d.actionLabel}</h2>
          <p>{d.headline}</p>
        </div>
        <span className={s.status}>
          {d.confidence}
          <small>
            {d.reference
              ? `Price reference · ${dateLabel(d.reference.asOf)}`
              : "Price evidence needs refresh"}
          </small>
        </span>
      </header>
      <div className={s.reasons}>
        <button onClick={() => onTab("Financials")}>
          <span>01 · Business</span>
          <strong>
            {d.business === "strong"
              ? "Business screen supported"
              : d.growthAssessment.eligible
                ? "Funded growth screen supported"
                : "Review the business evidence"}
          </strong>
          <small>
            {d.period
              ? `Reported period · ${dateLabel(d.period)}`
              : "Comparable reports needed"}
          </small>
        </button>
        <button onClick={() => onTab("Valuation")}>
          <span>02 · Valuation</span>
          <strong>
            {d.value === "attractive"
              ? "Below model entry screen"
              : d.value === "fair"
                ? "Near model value"
                : d.value === "expensive"
                  ? "Above model value"
                  : "Model inputs incomplete"}
          </strong>
          <small>{d.valuation?.label ?? "Inspect the missing evidence"}</small>
        </button>
        <button onClick={() => onTab("Technicals")}>
          <span>03 · Price conditions</span>
          <strong>
            {d.pace.level === null
              ? "Current zone unavailable"
              : `Current zone · P${d.pace.level}`}
          </strong>
          <small>
            {d.pace.provisional
              ? "May change before month-end"
              : "Latest eligible closing observation"}
          </small>
        </button>
      </div>
      <div className={s.context}>
        <p>
          <b>Main concern</b>
          {d.risks[0] ??
            "Keep the position within your cash and concentration limits."}
        </p>
        <p>
          <b>What would change this?</b>
          {d.changeConditions[0] ??
            "Review the next financial report and current price conditions."}
        </p>
      </div>
    </section>
  );
}
