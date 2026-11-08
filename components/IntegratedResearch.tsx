"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  return (
    <>
      <div className={s.overview}>
        <PaceInstrument
          research={r}
          decision={d}
          ownsPosition={owns}
          now={now}
          view={m.edge.pacePresentation}
          readings={m.edge.pacePeriods}
          onHistory={() => onTab("Technicals")}
        />
        <div className={s.chart}>{chart}</div>
        <div className={s.scenarios}>
          <AnalystTargets research={r} />
        </div>
        <div className={s.overviewMetrics}>
          <ResearchEvidenceGrid research={r} onTab={onTab} />
        </div>
      </div>
    </>
  );
}
