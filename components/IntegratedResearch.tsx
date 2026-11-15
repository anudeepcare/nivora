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
import ScenarioLenses from "./ScenarioLenses";
import StockPillars from "./StockPillars";
import ResearchConclusion from "./ResearchConclusion";
import PaceInstrument from "./PaceInstrument";
import s from "./ResearchOverview.module.css";
import CompanyMetrics from "./CompanyMetrics";
import ResearchEvidenceGrid from "./ResearchEvidenceGrid";
import EvidenceCrystal from "./EvidenceCrystal";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import { DataFreshness } from "./ResearchBrief";
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
  const analyst = useMemo(() => consensusOutlook(r), [r]);
  const showConsensus =
    !!analyst && (analyst.low == null || analyst.high == null);
  const m = useMemo(
      () => approvedResearch(r, decisionOwns, now),
      [r, decisionOwns, now],
    ),
    d = m.decision;
  return (
    <div className={s.overview}>
      <section
        className={s.decisionStage}
        aria-label="Decision and market context"
      >
        <div className={s.stageHeading}>
          <span>01 / THE DECISION</span>
          <p>Business evidence first. Price context second.</p>
        </div>
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
        <div className={s.chart}>{chart}</div>
      </section>
      <div className={s.caseWorkspace}>
        <div className={s.brief}>
          <ResearchConclusion decision={d} asOf={r.retrievedAt} onTab={onTab} />
        </div>
        <div className={s.pillars}>
          <StockPillars research={r} decision={d} />
          {showConsensus && (
            <details className={s.consensusDetails}>
              <summary>
                Wall Street consensus{" "}
                <span>Target, comparison &amp; source dates</span>
              </summary>
              <AnalystTargets research={r} embedded />
            </details>
          )}
        </div>
      </div>
      <section
        className={s.overviewMetrics}
        aria-label="Company metrics and research sections"
      >
        <header className={s.sectionHeading}>
          <div>
            <small className={s.sectionIndex}>02 / THE EVIDENCE</small>
            <h2>Company at a glance</h2>
          </div>
          <span>Dated metrics · open any label for its basis</span>
        </header>
        <CompanyMetrics research={r} />
        <ResearchEvidenceGrid research={r} onTab={onTab} />
      </section>
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
        className={s.researchTools}
        open={evidenceOpen}
        onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}
      >
        <summary>
          Sources &amp; methods <span>Dates, coverage and deeper research</span>
        </summary>
        {evidenceOpen && (
          <div className={s.supportingEvidence}>
            <DataFreshness research={r} now={now} wide decision={d} />
            <ScenarioLenses research={r} decision={d} hideSingle />
            <EvidenceCrystal
              key={r.company.symbol}
              research={r}
              onOpen={() => onTab("Thesis")}
            />
          </div>
        )}
      </details>
    </div>
  );
}
