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
        highest pace level, not a fourfold return forecast.
      </p>
      <p>
        A business-risk pause is separate from P0. When the AURYN View is Wait,
        Hold, Reduce, Sell or Avoid, the price reading cannot independently
        authorise increased contributions.
      </p>
    </Help>
  );
}
