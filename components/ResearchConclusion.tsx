"use client";
import { ArrowUpRight, GitBranch, ShieldAlert } from "lucide-react";
import type { aurynDecision } from "@/lib/auryn-decision";
import type { EvidenceSection } from "@/lib/approved-research";
import { dateLabel } from "@/lib/format";
import DetailDialog from "./DetailDialog";
import s from "./ResearchConclusion.module.css";

/** Explains the supplied decision. It does not run or reinterpret the engine. */
export default function ResearchConclusion({
  decision: d,
  asOf,
  onTab,
}: {
  decision: ReturnType<typeof aurynDecision>;
  asOf: string;
  onTab: (tab: EvidenceSection) => void;
}) {
  const risks = [...new Set(d.risks)];
  const conditions = [...new Set(d.changeConditions)];
  return (
    <section className={s.root} aria-label="The 30-second read">
      <header>
        <span className={s.eyebrow}>The 30-second read</span>
        <small>Snapshot {dateLabel(asOf)}</small>
      </header>
      <h2>{d.explanation.label}</h2>
      <p className={s.explanation}>{d.explanation.detail}</p>
      <DetailDialog
        title="Why this view"
        trigger={`Why this view${risks.length + conditions.length ? ` · ${risks.length + conditions.length}` : ""}`}
        className={s.more}
      >
        <p>{d.explanation.detail}</p>
        <div className={s.evidence}>
          {risks.length > 0 && (
            <div className={s.risks}>
              <h3>
                <ShieldAlert size={16} /> What needs attention
              </h3>
              <ul>
                {risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
          {conditions.length > 0 && (
            <div className={s.conditions}>
              <h3>
                <GitBranch size={16} /> What would change the view
              </h3>
              <ul>
                {conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DetailDialog>
      <button type="button" onClick={() => onTab("Thesis")}>
        Business evidence <ArrowUpRight size={16} />
      </button>
    </section>
  );
}
