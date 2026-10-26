"use client";
import { Check, ArrowUpRight, Scale, Minus } from "lucide-react";
import type { Research } from "@/lib/types";
import { researchEdge } from "@/lib/edge-research";
import PositionExplorer from "./PositionExplorer";

export default function ResearchBalance({
  research: r,
  onTab,
  reading,
}: {
  research: Research;
  reading: ReturnType<typeof researchEdge>;
  onTab: (tab: "Thesis" | "Valuation" | "Financials") => void;
}) {
  const edge = reading,
    b = edge.brief;
  const supports = b.support;
  const limits = b.counterCase.length ? b.counterCase : [edge.risk];
  return (
    <div className="research-decision-tools">
      <section
        className="research-balance"
        aria-label="The case for buying and waiting"
      >
        <header>
          <span className="experience-kicker">
            <Scale size={15} /> WEIGH BOTH SIDES
          </span>
          <h3>The decision behind the numbers.</h3>
          <p>Evidence to consider before your next move.</p>
        </header>
        <div className="balance-columns">
          <div>
            <h4>
              {supports.length > 0 && <Check size={16} />} What supports the
              case
            </h4>
            {supports.length ? (
              supports.slice(0, 2).map((s, i) => (
                <button key={i} onClick={() => onTab("Financials")}>
                  {s}
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <p className="balance-unavailable">
                No supporting evidence available.{" "}
                <button onClick={() => onTab("Thesis")}>
                  Review evidence coverage <ArrowUpRight size={15} />
                </button>
              </p>
            )}
          </div>
          <div>
            <h4>
              <Minus size={16} /> What makes it a wait
            </h4>
            {limits.slice(0, 2).map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  onTab(b.counterCase.length ? "Financials" : "Thesis")
                }
              >
                {s}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </div>
        <div className="balance-checkpoint">
          <span>NEXT CHECKPOINT</span>
          <p>{edge.turningPoint}</p>
          <button className="text-button" onClick={() => onTab("Thesis")}>
            Open the evidence <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
      <PositionExplorer research={r} reading={reading} />
    </div>
  );
}
