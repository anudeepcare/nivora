"use client";
import { useState } from "react";
import type { Research } from "@/lib/types";
import {
  PACE_EXPLANATION,
  PACE_LEVELS,
  PACE_DESCRIPTIONS,
} from "@/lib/pace-presentation";
import { Help } from "./Ui";
import PacePriceZones from "./PacePriceZones";
export default function PaceHelp({
  trigger,
  research,
  asOf,
}: {
  trigger?: string;
  research?: Research;
  asOf?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Help label="How AURYN Accumulation Pace works" trigger={trigger}>
      <p>
        Pace shows the current accumulation zone. P0 pauses; P1 watches or
        holds; P2 starts small; P3 builds gradually; P4 is the deepest planned
        zone.
      </p>
      <p>
        Confirmed readings use a completed period. A provisional reading can
        change before the period ends, monthly or weekly. Business checks and
        position limits still apply.
      </p>
      {research && (
        <details onToggle={(e) => setOpen(e.currentTarget.open)}>
          <summary>Show stock price zones · P0–P4</summary>
          <PacePriceZones
            research={research}
            asOf={asOf ?? research.priceObservedAt ?? research.retrievedAt}
            active={open}
          />
        </details>
      )}
      <details>
        <summary>Framework rules</summary>
        <p>{PACE_EXPLANATION}</p>
        <dl className="pace-help-levels">
          {PACE_LEVELS.map((label, level) => (
            <div key={level}>
              <dt>
                P{level} · {label}
              </dt>
              <dd>{PACE_DESCRIPTIONS[level]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Help>
  );
}
