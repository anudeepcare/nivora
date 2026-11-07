"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Bell,
  ChevronDown,
} from "lucide-react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { valuationScale } from "@/lib/research-summary";
import { useProduct } from "./Session";
import PaceInstrument from "./PaceInstrument";
import ScenarioSensitivity from "./ScenarioSensitivity";
import DecisionInsights from "./DecisionInsights";
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
  const scenarioCases = m.cases;
  const scenarioScale =
    m.scenarioReference != null
      ? valuationScale(
          scenarioCases.map((c) => c.target),
          m.scenarioReference,
        )
      : null;
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <>
      <div className={s.overview}>
        <PaceInstrument
          research={r}
          ownsPosition={owns}
          now={now}
          view={m.edge.pacePresentation}
          readings={m.edge.pacePeriods}
          onHistory={() => onTab("Technicals")}
        />
        <div className={s.chart}>{chart}</div>
        <div
          className={s.scenarios}
          aria-label={
            m.scenarioEnd
              ? "Explore valuation scenarios"
              : "Historical price risk"
          }
        >
          {scenarioCases.length === 0 ? (
            <div className={s.scenarioUnavailable}>
              <strong>Valuation scenarios need more evidence</strong>
              <span>
                No comparable scenario values are established in this snapshot.
              </span>
              <button onClick={() => onTab("Valuation")}>
                Review valuation evidence <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className={s.scenarioCaption}>
                <span>
                  {m.scenarioEnd
                    ? "Conditional valuation scenarios"
                    : "Historical price-risk cases"}
                  {" · "}
                  {m.scenarioEnd
                    ? dateLabel(m.scenarioEnd)
                    : `${m.scenarioHorizon} sessions`}
                </span>
                <span>
                  Reference {amount(m.scenarioReference, r.quote.currency)} ·{" "}
                  {dateLabel(m.scenarioReferenceDate)}
                </span>
              </div>
              {scenarioCases.map((c, i) => {
                const name = ["Bear", "Base", "Bull"][i];
                const title = m.scenarioEnd
                  ? `${name} scenario`
                  : [
                      "Historical downside",
                      "Historical midpoint",
                      "Historical upside",
                    ][i];
                const Icon = [ArrowDownRight, Minus, ArrowUpRight][i];
                return (
                  <button
                    key={name}
                    className={s.scenario}
                    data-case={name}
                    onClick={() =>
                      onTab(m.scenarioEnd ? "Analysts" : "Technicals")
                    }
                    aria-label={
                      m.scenarioEnd
                        ? `Explore ${name.toLowerCase()} scenario assumptions`
                        : `Explore historical ${["lower", "median", "upper"][i]} outcome`
                    }
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
                      {m.scenarioEnd
                        ? [
                            "Lower earnings power",
                            "Central assumptions",
                            "Higher earnings power",
                          ][i]
                        : `${[10, 50, 90][i]}th percentile`}
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
                {m.scenarioEnd
                  ? "Conditional estimates, not probabilities."
                  : "Past return percentiles applied to the reference; not fair values or forecasts."}
              </p>
            </>
          )}
        </div>
        <div className={s.overviewMetrics}>
          <ResearchEvidenceGrid research={r} onTab={onTab} />
        </div>
      </div>
      <DecisionInsights research={r} owns={owns} now={now} prefix={prefix} />
      <div className={s.market}>
        <details className={s.evidence}>
          <summary>
            Supporting facts & risks <ChevronDown size={15} />
          </summary>
          <ul>
            {d.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {d.risks.slice(1).map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
          <div className={s.evidenceActions}>
            <Link
              href={`${prefix}/alerts?symbol=${encodeURIComponent(r.company.symbol)}`}
            >
              <Bell size={15} /> Set an alert
            </Link>
            <button className="text-link" onClick={() => onTab("Valuation")}>
              See valuation assumptions <ArrowRight size={15} />
            </button>
          </div>
        </details>
      </div>
    </>
  );
}
