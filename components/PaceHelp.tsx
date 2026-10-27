"use client";
import { PACE_EXPLANATION, PACE_LEVELS } from "@/lib/pace-presentation";
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
            <dd>
              {level === 0
                ? "Pause scheduled contributions under the price policy."
                : `${level}× the usual scheduled contribution under the price policy.`}
            </dd>
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
        Business first: a qualifying business with confirmed P1–P4 supports
        gradual Buy/Add guidance. P0 pauses additions, not the business case.
        Review explains an incomplete assessment or unmet business checks.
        Reduce, Sell or Avoid take priority when business risks are triggered.
        Valuation remains a separate check; Pace does not prove a stock is
        cheap.
      </p>
    </Help>
  );
}
