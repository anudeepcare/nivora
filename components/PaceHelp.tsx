"use client";
import {
  PACE_EXPLANATION,
  PACE_LEVELS,
  PACE_DESCRIPTIONS,
} from "@/lib/pace-presentation";
import { Help } from "./Ui";
export default function PaceHelp({ trigger }: { trigger?: string }) {
  return (
    <Help label="AURYN Pace · what P means" trigger={trigger}>
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
        <strong>Contribution guide:</strong> 1× means your normal planned
        contribution; 2× means twice that amount; 3× means three times; and
        4× is an upper guide only. For example, a $100 plan at 2× means $200.
        P0 and P1 show 0× for new contributions. Never exceed your cash budget,
        position limit or concentration limit.
      </p>
    </Help>
  );
}
