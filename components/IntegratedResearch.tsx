"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { useProduct } from "./Session";
import ResearchChanges from "./ResearchChanges";
import SelectedValuation from "./SelectedValuation";
import PaceInstrument from "./PaceInstrument";
import ResearchEvidenceGrid from "./ResearchEvidenceGrid";
import s from "./ResearchOverview.module.css";
import EvidenceCrystal from "./EvidenceCrystal";
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
      <div className={s.overview}>
        <div className={s.paceColumn}>
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
            editorial
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
        <div className={s.crystal}>
          <EvidenceCrystal research={r} onOpen={() => onTab("Thesis")} />
        </div>
        <div className={s.chart}>{chart}</div>
        <div
          className={s.scenarios}
          aria-label={"Explore AURYN valuation assumptions"}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <SelectedValuation research={r} />
          </div>
        </div>
        <div className={s.overviewMetrics}>
          <ResearchEvidenceGrid research={r} onTab={onTab} />
        </div>
      </div>
    </>
  );
}
