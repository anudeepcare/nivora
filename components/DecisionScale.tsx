"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { decisionGuide } from "@/lib/decision-guide";
import { scaleBalance, scaleLayout, scaleStones, type ScaleStone } from "@/lib/decision-scale";
import { dateLabel } from "@/lib/format";

const LEAN_LABEL = {
  supportive: "Your scale leans supportive",
  even: "Your scale is close to even",
  cautious: "Your scale leans cautious",
} as const;

function Pan({ x, tilt, stones, side }: { x: number; tilt: number; stones: ScaleStone[]; side: "for" | "against" }) {
  const spots = scaleLayout(stones.map((s) => s.weight));
  return (
    <g transform={`translate(${x} 36) rotate(${-tilt})`}>
      <line className="scale-string" x1="0" y1="0" x2="-52" y2="96" />
      <line className="scale-string" x1="0" y1="0" x2="52" y2="96" />
      <g transform="translate(0 94)">
        {spots.map((p, i) => (
          <circle key={stones[i].id} className="scale-stone" data-side={side} cx={p.cx} cy={p.cy} r={p.r} />
        ))}
      </g>
      <line className="scale-pan" data-side={side} x1="-56" y1="96" x2="56" y2="96" />
    </g>
  );
}

export default function DecisionScale({ research: r }: { research: Research }) {
  const stones = useMemo(() => scaleStones(r), [r]);
  const guide = useMemo(() => decisionGuide(r), [r]);
  const [off, setOff] = useState<string[]>([]);
  if (!stones.length) return null;
  const toggle = (id: string) => setOff((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const kept = (side: "for" | "against") => stones.filter((s) => s.side === side && !off.includes(s.id));
  const bal = scaleBalance(stones, off);
  const forKept = kept("for"),
    againstKept = kept("against");
  const needsData = guide.buying.code === "data";
  return (
    <section className="decision-scale" aria-label="Weigh the evidence yourself" data-lean={bal.lean}>
      <header className="decision-scale-head">
        <div>
          <span className="eyebrow">Decision</span>
          <h2>Weigh the evidence yourself</h2>
          <p>
            Each stone is evidence from this company’s own data. Take off any you do not accept and watch the scale. This
            is a weighing of evidence, not a recommendation.
          </p>
        </div>
        <div className="decision-scale-rules">
          <div data-tone={guide.buying.tone}>
            <span>Considering a buy</span>
            <b>{guide.buying.label}</b>
            <small>{guide.buying.reason}</small>
          </div>
          <div data-tone={guide.owning.tone}>
            <span>If you already own it</span>
            <b>{guide.owning.label}</b>
            <small>{guide.owning.reason}</small>
          </div>
        </div>
      </header>
      <div className="decision-scale-body">
        <div className="decision-scale-figure">
          <svg
            viewBox="0 0 340 190"
            role="img"
            aria-label={`Evidence scale. Supporting weight ${bal.forWeight}, cautionary weight ${bal.againstWeight}. ${LEAN_LABEL[bal.lean]}.`}
          >
            <line className="scale-post" x1="170" y1="36" x2="170" y2="176" />
            <line className="scale-post" x1="130" y1="176" x2="210" y2="176" />
            <g transform={`rotate(${bal.tilt} 170 36)`}>
              <line className="scale-beam" x1="50" y1="36" x2="290" y2="36" />
              <Pan x={50} tilt={bal.tilt} stones={forKept} side="for" />
              <Pan x={290} tilt={bal.tilt} stones={againstKept} side="against" />
            </g>
            <circle className="scale-pivot" cx="170" cy="36" r="8" />
          </svg>
          <div className="decision-scale-legend" aria-hidden="true">
            <span data-side="for">Supports · {bal.forWeight}</span>
            <span data-side="against">Cautions · {bal.againstWeight}</span>
          </div>
          <p className="decision-scale-lean" role="status">
            <b>{LEAN_LABEL[bal.lean]}.</b>{" "}
            {off.length > 0
              ? `You took ${off.length} stone${off.length > 1 ? "s" : ""} off the scale.`
              : "Take off any stone you do not accept."}
          </p>
          {off.length > 0 && (
            <button type="button" className="text-button" onClick={() => setOff([])}>
              Put all the evidence back
            </button>
          )}
        </div>
        <div className="decision-scale-stones">
          {(["for", "against"] as const).map((side) => (
            <div key={side} className="decision-scale-column" data-side={side}>
              <h3>{side === "for" ? "Reasons that support the case" : "Reasons to wait or review"}</h3>
              {stones
                .filter((s) => s.side === side)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="decision-stone"
                    data-side={s.side}
                    data-weight={s.weight}
                    aria-pressed={!off.includes(s.id)}
                    onClick={() => toggle(s.id)}
                  >
                    <span className="decision-stone-dot" aria-hidden="true" />
                    <span>
                      <b>
                        {s.title}
                        {s.fact ? <em> · {s.fact}</em> : null}
                      </b>
                      <small>{s.detail}</small>
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
      <footer className="decision-scale-foot">
        {needsData && <b>Some evidence is missing or stale. Refresh before relying on this. </b>}
        Financial period {guide.financialPeriod ? dateLabel(guide.financialPeriod) : "not available"} · price as of{" "}
        {guide.priceAsOf ? dateLabel(guide.priceAsOf) : "not available"}. Heavier stones are severe rule flags or eligible
        conditional cases. Nothing here places an order or sets a position size.
      </footer>
    </section>
  );
}
