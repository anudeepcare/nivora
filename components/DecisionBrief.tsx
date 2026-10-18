"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { consensusOutlook } from "@/lib/outlook";
import { percent } from "@/lib/format";
import { decisionGuide } from "@/lib/decision-guide";
import { Help } from "./Ui";
export default function DecisionBrief({
  research: r,
  onDca,
}: {
  research: Research;
  onDca: () => void;
}) {
  const p = useMemo(() => perspective(r), [r]);
  const d = useMemo(() => decisionGuide(r, p), [r, p]);
  const [context, setContext] = useState<"new" | "own">("new");
  const valuation = useMemo(() => consensusOutlook(r), [r]);
  const action = context === "new" ? d.buying : d.owning;
  return (
    <section
      className="decision"
      data-tone={action.tone}
      aria-label="Investment decision guide"
    >
      <div className="row between">
        <span className="eyebrow">Research decision</span>
        <div className="segments" aria-label="Position context">
          {(["new", "own"] as const).map((v) => (
            <button
              key={v}
              className={context === v ? "active" : ""}
              aria-pressed={context === v}
              onClick={() => setContext(v)}
            >
              {v === "new" ? "New position" : "Already own"}
            </button>
          ))}
        </div>
      </div>
      <div className="decision-head">
        <h2>{action.label}</h2>
      </div>
      <p>{action.reason}</p>
      <div className="perspective-grid">
        <div>
          <span>Business quality</span>
          <b>{p.business}</b>
          <small>Latest reported operating evidence</small>
        </div>
        <div>
          <span>Valuation context</span>
          <b>
            {valuation
              ? `${percent(valuation.change, true)} to consensus`
              : "Evidence incomplete"}
          </b>
          <small>Analyst opinion; fair value assessed separately</small>
        </div>
        <div>
          <span>Entry timing</span>
          <b>{p.tech.trend}</b>
          <small>Completed prices; separate from long-term thesis</small>
        </div>
      </div>
      <div className="decision-foot">
        <span>
          Business <b>{p.business}</b>
        </span>
        <span>
          Timing <b>{p.tech.trend}</b>
        </span>
        <Help label="How action labels work" trigger="Why this view">
          <p>
            These are original research rules, not executable trade
            instructions. Buy candidate requires current positive profit and
            cash generation, revenue growth and aligned price trend. It does not
            establish fair value. A weak price trend is separate from a
            long-term business thesis.
          </p>
          <p>
            Trim review flags an extended confirmed monthly price and elevated
            RSI. Sell review flags losses and cash outflows in two comparable
            periods with falling revenue. Specialist businesses are reviewed
            separately. Your position size, tax situation and thesis matter.
          </p>
        </Help>
      </div>
    </section>
  );
}
