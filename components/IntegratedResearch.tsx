"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { useProduct } from "./Session";
import ResearchChanges from "./ResearchChanges";
import SelectedValuation from "./SelectedValuation";
import { scenarioHeadline } from "@/lib/scenario-headline";
import ScenarioLenses from "./ScenarioLenses";
import StockPillars from "./StockPillars";
import PaceInstrument from "./PaceInstrument";
import s from "./ResearchOverview.module.css";
import CompanyMetrics from "./CompanyMetrics";
import ResearchEvidenceGrid from "./ResearchEvidenceGrid";
import EvidenceCrystal from "./EvidenceCrystal";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import { OverviewBrief, DataFreshness } from "./ResearchBrief";
export default function IntegratedResearch({
  research: r,
  onTab,
  chart,
}: {
  research: Research;
  onTab: (tab: EvidenceSection) => void;
  chart?: ReactNode;
  pro?: boolean;
}) {
  const { workspace, demo } = useProduct();
  const owns = !!workspace?.positions.some(
    (p) => sameProviderSymbol(p.symbol, r.company.symbol) && p.quantity > 0,
  );
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [context, setContext] = useState<boolean | null>(null);
  const decisionOwns = context ?? owns;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "hidden") setClock(Date.now());
    };
    const id = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);
  const now = demo ? Date.parse(r.retrievedAt) : clock;
  const m = useMemo(
      () => approvedResearch(r, decisionOwns, now),
      [r, decisionOwns, now],
    ),
    d = m.decision;
  return (
    <>
      <OverviewBrief research={r} now={now} owns={decisionOwns} decision={d} />
      <StockPillars research={r} decision={d} />
      <div className={s.overview}>
        <div className={s.context} aria-label="Decision context">
          <button
            type="button"
            aria-pressed={decisionOwns}
            onClick={() => setContext(true)}
          >
            {owns ? "For your holding" : "For an existing holding"}
          </button>
          <button
            type="button"
            aria-pressed={!decisionOwns}
            onClick={() => setContext(false)}
          >
            For a new purchase
          </button>
        </div>
        <div className={s.paceColumn}>
          <PaceInstrument
            key={`${r.company.symbol}:${decisionOwns}`}
            research={r}
            decision={d}
            ownsPosition={decisionOwns}
            now={now}
            view={m.edge.pacePresentation}
            readings={m.edge.pacePeriods}
            onHistory={() => onTab("Technicals")}
            branded
          />
        </div>
        {d.risks.length > 0 && (
          <details className={s.decisionNotes}>
            <summary>
              {d.risks.length} {d.risks.length === 1 ? "risk" : "risks"} to
              review
            </summary>
            <ul>
              {d.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </details>
        )}
        <div className={s.changes}>
          <ResearchChanges
            research={r}
            now={now}
            pace={
              d.pace?.level == null
                ? null
                : {
                    level: d.pace.level,
                    policy: d.brief?.accumulation?.version ?? "monthly",
                    date: d.pace.date ?? "",
                    source: r.historySource ?? null,
                  }
            }
            onOpen={onTab}
          />
        </div>
        <details
          className={s.crystal}
          open={evidenceOpen}
          onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}
        >
          <summary>
            <span>Explore the evidence</span>
            <small>Eight research lenses · inputs and explanations</small>
          </summary>
          {evidenceOpen && (
            <EvidenceCrystal
              key={r.company.symbol}
              research={r}
              onOpen={() => onTab("Thesis")}
            />
          )}
        </details>
        <div className={s.chart}>{chart}</div>
        <div className={s.scenarios} aria-label="Scenario evidence">
          <div style={{ gridColumn: "1 / -1" }}>
            <SelectedValuation
              research={r}
              hideUnavailable={!!consensusOutlook(r)}
              historicalFallback
              headline={scenarioHeadline(r)}
            />
            <ScenarioLenses research={r} decision={d} hideSingle />
          </div>
        </div>
        <div className={s.consensusRow} data-has-target={!!consensusOutlook(r)}>
          {consensusOutlook(r) && <AnalystTargets research={r} />}
          <DataFreshness
            research={r}
            now={now}
            wide={!consensusOutlook(r)}
            decision={d}
          />
        </div>
        <div className={s.overviewMetrics}>
          <CompanyMetrics research={r} />
          <ResearchEvidenceGrid research={r} onTab={onTab} />
        </div>
      </div>
    </>
  );
}
