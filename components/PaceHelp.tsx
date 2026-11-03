"use client";
import {
  PACE_EXPLANATION,
  PACE_LEVELS,
  PACE_DESCRIPTIONS,
} from "@/lib/pace-presentation";
import { Help } from "./Ui";
export default function PaceHelp({ trigger }: { trigger?: string }) {
  return (
    <Help label="How AURYN Pace works" trigger={trigger}>
      <p>Pace combines a monthly price zone with business and data checks to guide gradual contributions.</p>
      <p><strong>Read the action first.</strong> A contribution guide appears when those checks support adding. 2× means twice your usual contribution, within your cash and position limits.</p>
      <p><strong>When it changes:</strong> confirmed price readings use completed periods. The developing reading can move during the current period. New financial evidence can change the business assessment.</p>
      <details>
      <summary>Technical levels and contribution rules</summary>
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
      <p>
        <strong>Confirmed</strong> uses the latest completed period.{" "}
        <strong>Forming</strong> can change until that period ends. P4 is the
        highest pace level, not a company-quality rating or fourfold return
        forecast. A business can improve while its share price falls. Keep every
        contribution within your cash budget and position limit.
      </p>
      <p>
        Business first: a qualifying business with confirmed P2–P4 supports
        accumulation. P1 means Watch for a new purchase or Hold for a holding.
        P0 pauses additions, not the business case. Review explains an
        incomplete assessment or unmet business checks. Reduce, Sell or Avoid
        take priority when business risks are triggered. Valuation remains a
        separate check; Pace does not prove a stock is cheap.
      </p>
      <p>
        <strong>Contribution guide:</strong> P0 and P1 mean no new contribution
        while entry conditions are absent. P2 is 1× your normal planned
        contribution, P3 is 2× and P4 is an upper 4× guide only. For example,
        a $100 plan at P3 means $200. Never exceed your cash budget, position
        limit or concentration limit.
      </p>
      </details>
    </Help>
  );
}
