import type { OverviewMetric } from "@/lib/overview-evidence";
import { amount, percent } from "@/lib/format";
import { Help } from "./Ui";

export default function OverviewEvidence({
  rows,
  label,
}: {
  rows: OverviewMetric[];
  label: string;
}) {
  return (
    <dl className="overview-metric-rows" aria-label={label}>
      {rows.map((row) => (
        <div key={row.key} data-tone={row.tone}>
          <dt>
            <Help label={row.label} trigger={row.label}>
              {row.help}
            </Help>
          </dt>
          <dd>
            {row.unit === "money"
              ? amount(row.value, row.currency, true)
              : row.unit === "percent"
                ? percent(row.value)
                : row.unit === "ratio"
                  ? `${row.value.toFixed(1)}×`
                  : row.value.toFixed(1)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
