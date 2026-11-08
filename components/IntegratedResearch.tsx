"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { valuationScale } from "@/lib/research-summary";
import { useProduct } from "./Session";
import ResearchChanges from "./ResearchChanges";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import PaceInstrument from "./PaceInstrument";
import ScenarioSensitivity from "./ScenarioSensitivity";
import ResearchEvidenceGrid from "./ResearchEvidenceGrid";
import s from "./IntegratedExperience.module.css";
import { amount, percent, dateLabel } from "@/lib/format";
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
  const m = useMemo(() => approvedResearch(r, owns, now), [r, owns, now]),
    d = m.decision;
  const analyst = consensusOutlook(r);
  const scenarioCases = m.cases;
  const scenarioScale =
    m.scenarioReference != null
      ? valuationScale(
          scenarioCases.map((c) => c.target),
          m.scenarioReference,
        )
      : null;
  return (
    <>
      <div className={s.overview}>
        <div className={s.paceColumn}>
          <PaceInstrument
            research={r}
            decision={d}
            ownsPosition={owns}
            now={now}
            view={m.edge.pacePresentation}
            readings={m.edge.pacePeriods}
            onHistory={() => onTab("Technicals")}
          />
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
        <div className={s.chart}>{chart}</div>
        <div
          className={s.scenarios}
          aria-label={"Explore AURYN valuation assumptions"}
        >
          {analyst ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <AnalystTargets research={r} />
            </div>
          ) : scenarioCases.length === 0 ? null : (
            <>
              <div className={s.scenarioCaption}>
                <span>
                  {m.scenarioBasis}
                  {" · "}
                  {m.scenarioEnd
                    ? dateLabel(m.scenarioEnd)
                    : "Present model value"}
                </span>
                <span>
                  Reference {amount(m.scenarioReference, r.quote.currency)} ·{" "}
                  {dateLabel(m.scenarioReferenceDate)}
                </span>
              </div>
              {scenarioCases.map((c, i) => {
                const name = ["Bear", "Base", "Bull"][i];
                const title =
                  m.scenarioKind === "cash-flow"
                    ? `${["Low", "Base", "High"][i]} model value`
                    : `${name} scenario`;
                const Icon =
                  c.change < 0
                    ? ArrowDownRight
                    : c.change > 0
                      ? ArrowUpRight
                      : Minus;
                return (
                  <button
                    key={name}
                    className={s.scenario}
                    data-case={name}
                    data-tone={
                      c.change < 0
                        ? "negative"
                        : c.change > 0
                          ? "positive"
                          : "neutral"
                    }
                    onClick={() => onTab("Valuation")}
                    aria-label={`Explore ${name.toLowerCase()} scenario assumptions`}
                  >
                    <span className={s.scenarioHeading}>
                      <i aria-hidden="true">
                        <Icon size={18} />
                      </i>
                      <strong>{title}</strong>
                    </span>
                    <span className={s.scenarioNumbers}>
                      <b className={s.scenarioValue}>
                        {amount(c.target, r.quote.currency)}
                      </b>
                      <small>{percent(c.change, true)}</small>
                    </span>
                    <span className={s.scenarioBasis}>
                      {m.scenarioKind === "earnings"
                        ? [
                            "Lower earnings power",
                            "Central assumptions",
                            "Higher earnings power",
                          ][i]
                        : [
                            "Lower growth · higher required return",
                            "Central cash-flow assumptions",
                            "Higher growth · lower required return",
                          ][i]}
                    </span>
                    {scenarioScale && (
                      <ScenarioSensitivity
                        className={s.scenarioRange}
                        target={c.target}
                        reference={m.scenarioReference!}
                        scale={scenarioScale}
                        label={`${title}: ${amount(c.target, r.quote.currency)}; reference ${amount(m.scenarioReference, r.quote.currency)}`}
                      />
                    )}
                  </button>
                );
              })}
              <p className={s.scenarioLegend}>
                <span>
                  Sensitivity diagrams · shared price scale · not a time path
                </span>
                {
                  "Conditional estimates, not probabilities. Analyst consensus is separate."
                }
              </p>
            </>
          )}
        </div>
        <div className={s.overviewMetrics}>
          <ResearchEvidenceGrid research={r} onTab={onTab} />
        </div>
      </div>
    </>
  );
}
