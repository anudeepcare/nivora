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
import ResearchEvidenceGrid from "./ResearchEvidenceGrid";
import EvidenceCrystal from "./EvidenceCrystal";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import StockFacts, { stockFactRows } from "./StockFacts";
import { amount, percent } from "@/lib/format";
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
  const closingRange = stockFactRows(r).find((row) =>
    row.label.includes("closing range"),
  );
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
        <div className={s.paceColumn}>
          <div className={s.stageHeading}>
            <span>THE DECISION · AURYN PACE</span>
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
            summaryView
          />
        </div>
        <div className={s.chart}>{chart}</div>
      </section>
      <div className={s.caseWorkspace}>
        <div className={s.decisionExplanation}>
          <ResearchConclusion decision={d} asOf={r.retrievedAt} onTab={onTab} />
        </div>
        <div className={s.pillars}>
          <StockPillars research={r} decision={d} />
        </div>
        <section className={s.rangeSnapshot} aria-label="Closing price range">
          <h2>{closingRange?.label ?? "Closing price range"}</h2>
          {closingRange?.range &&
            closingRange.range.high > closingRange.range.low && (
              <div
                className={s.rangeMeter}
                role="img"
                aria-label={`Latest completed close ${amount(closingRange.range.close, r.quote.currency)} within the stated closing range`}
              >
                <i
                  style={{
                    left: `${Math.max(0, Math.min(100, (100 * (closingRange.range.close - closingRange.range.low)) / (closingRange.range.high - closingRange.range.low)))}%`,
                  }}
                />
              </div>
            )}
          <strong>{closingRange?.value ?? "Not available"}</strong>
          <p>
            {closingRange?.date ?? "Completed price history is not available."}
          </p>
          <details className={s.rangeDetails}>
            <summary>About this range</summary>
            <p>{closingRange?.help ?? "No price range has been inferred."}</p>
          </details>
        </section>
        <section
          className={s.consensusSnapshot}
          aria-label="Wall Street consensus"
        >
          <h2>Wall Street consensus</h2>
          <strong>
            {analyst
              ? amount(analyst.target, r.quote.currency)
              : "Not available"}
          </strong>
          {analyst?.change != null && (
            <span className={analyst.change < 0 ? "negative" : "positive"}>
              {percent(analyst.change, true)}
            </span>
          )}
          <p>Analyst consensus, not guaranteed.</p>
          <details className={s.consensusDetails}>
            <summary>Target details &amp; source dates</summary>
            <AnalystTargets research={r} embedded showUnavailable />
          </details>
        </section>
      </div>
      <section
        className={s.overviewMetrics}
        aria-label="Company metrics and research sections"
      >
        <header className={s.sectionHeading}>
          <div>
            <h2>The evidence</h2>
          </div>
          <span>Dated metrics · open any label for its basis</span>
        </header>
        <ResearchEvidenceGrid research={r} onTab={onTab} />
        <div className={s.mobileFacts}>
          <StockFacts research={r} />
        </div>
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
