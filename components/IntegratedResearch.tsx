"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ShieldCheck,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { useProduct } from "./Session";
import PaceInstrument from "./PaceInstrument";
import AnalystTargets from "./AnalystTargets";
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
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <>
      <div className={s.overview}>
        <PaceInstrument
          view={m.edge.pacePresentation}
          readings={m.edge.pacePeriods}
          onHistory={() => onTab("Technicals")}
        />
        <div className={s.chart}>{chart}</div>
        <div className={s.scenarios} aria-label="Explore valuation scenarios">
          {scenarioCases.length === 0 ? <div className={s.scenarioUnavailable}><strong>Valuation scenarios need more evidence</strong><span>No comparable scenario values are established in this snapshot.</span><button onClick={() => onTab("Valuation")}>Review valuation evidence <ArrowRight size={15}/></button></div> : <>
          <p className={s.scenarioCaption}>{m.scenarioBasis} · {m.scenarioEnd ? dateLabel(m.scenarioEnd) : `${m.scenarioHorizon} sessions`} · {m.scenarioEnd ? "Conditional estimates" : "Price risk, not fair value"} · Reference {amount(m.scenarioReference, r.quote.currency)} ({dateLabel(m.scenarioReferenceDate)})</p>
          {[
            ["Bear", "More challenging conditions and lower earnings power.", "↘"],
            ["Base", "A balanced path with steady execution.", "↔"],
            ["Bull", "A more favorable backdrop with stronger momentum.", "↗"],
          ].map(([name, description, icon], i) => (
            <button key={name} className={s.scenario} data-case={name} onClick={() => onTab("Valuation")} aria-label={`Explore ${name.toLowerCase()} scenario assumptions`}>
              <i aria-hidden="true">{icon}</i>
              <span><strong>{name} scenario</strong><b className={s.scenarioValue}>{amount(scenarioCases[i]?.target, r.quote.currency)}</b><small>{percent(scenarioCases[i]?.change, true)} vs reference price</small><small>{m.scenarioEnd ? description : "Historical range sensitivity; not a forecast."}</small></span>
              <svg viewBox="0 0 120 70" aria-hidden="true">
                <path d={`M40 36 L118 ${i === 0 ? 24 : i === 1 ? 12 : 2} L118 ${i === 0 ? 68 : i === 1 ? 60 : 44} Z`} fill="currentColor" opacity=".12"/>
                <path d={`M40 36 L118 ${i === 0 ? 38 : i === 1 ? 26 : 12} L118 ${i === 0 ? 57 : i === 1 ? 48 : 34} Z`} fill="currentColor" opacity=".12"/>
                <path d="M0 42 7 39 13 41 22 35 29 37 35 34 40 36" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
                <path d={`M40 36 Q80 34 118 ${i === 0 ? 48 : i === 1 ? 36 : 23}`} fill="none" stroke="currentColor" strokeDasharray="3 3"/>
              </svg>
            </button>
          ))}</>}
        </div>
        <div className={s.overviewMetrics}><ResearchEvidenceGrid research={r} onTab={onTab} /></div>
      </div>
      <div className={s.analysis}>
          <section className={s.brief}>
            <ShieldCheck size={20} />
            <div>
              <h2>Business & price</h2>
              <p>{d.headline}</p>
              {d.risks[0] && <p>{d.risks[0]}</p>}
            </div>
          </section>
        <section className={s.reasons}>
          <h2>What supports the view</h2>
          <ul>{d.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
      </div>
      <div className={s.market}>
          <div className={s.bottom}>
            <section>
              <AnalystTargets research={r} showUnavailable />
              <button onClick={() => onTab("Analysts")}>
                View analyst coverage <ArrowRight size={15} />
              </button>
            </section>
            <section>
              <h3>
                <CalendarDays size={17} /> What changes the view
              </h3>
              <p>
                {d.changeConditions[0] ||
                  "Review the next company update and any changes in the evidence."}
              </p>
              <button onClick={() => onTab("News")}>
                News & earnings <ArrowRight size={15} />
              </button>
            </section>
          </div>
          <details className={s.evidence}>
            <summary>
              Reasons, risks & next steps <ChevronDown size={15} />
            </summary>
            <p>{d.explanation.detail}</p>
            <ul>
              {d.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {d.risks.slice(1).map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
            <p>
              New purchase: <strong>{d.actionLabels.entry}</strong> · Existing
              holding: <strong>{d.actionLabels.holding}</strong>
            </p>
            <Link
              href={`${prefix}/alerts?symbol=${encodeURIComponent(r.company.symbol)}`}
            >
              <Bell size={15} /> Set an alert
            </Link>
            <button className="text-link" onClick={() => onTab("Valuation")}>
              See valuation assumptions <ArrowRight size={15} />
            </button>
          </details>
      </div>
    </>
  );
}
