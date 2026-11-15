"use client";
import { ArrowUpRight, GitBranch, ShieldAlert } from "lucide-react";
import type { aurynDecision } from "@/lib/auryn-decision";
import type { EvidenceSection } from "@/lib/approved-research";
import { dateLabel } from "@/lib/format";
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
      <div className={s.evidence}>
        {risks.length > 0 && (
          <div className={s.risks}>
            <h3>
              <ShieldAlert size={16} /> What needs attention
            </h3>
            <ul>
              {risks.slice(0, 2).map((risk) => (
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
              {conditions.slice(0, 2).map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {(risks.length > 2 || conditions.length > 2) && (
        <details className={s.more}>
          <summary>
            More research considerations{" "}
            <span>
              {Math.max(0, risks.length - 2) +
                Math.max(0, conditions.length - 2)}
            </span>
          </summary>
          {risks.length > 2 && (
            <div>
              <h3>Additional risks</h3>
              <ul>
                {risks.slice(2).map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
          {conditions.length > 2 && (
            <div>
              <h3>Other conditions to monitor</h3>
              <ul>
                {conditions.slice(2).map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}
      <button type="button" onClick={() => onTab("Thesis")}>
        Follow the business evidence <ArrowUpRight size={16} />
      </button>
    </section>
  );
}
