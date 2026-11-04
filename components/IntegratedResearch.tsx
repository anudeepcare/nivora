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
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <>
      <div className={s.overview}>
        <PaceInstrument
          view={m.edge.pacePresentation}
          readings={m.edge.pacePeriods}
          onHistory={() => onTab("Technicals")}
        />
        <div className={s.market}>
          <section className={s.brief}>
            <ShieldCheck size={20} />
            <div>
              <h2>Business & price</h2>
              <p>{d.headline}</p>
              {d.risks[0] && <p>{d.risks[0]}</p>}
            </div>
          </section>
          <div className={s.chart}>{chart}</div>
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
      </div>
      <ResearchEvidenceGrid research={r} onTab={onTab} />
    </>
  );
}
