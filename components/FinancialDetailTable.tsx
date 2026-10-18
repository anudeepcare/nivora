"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import {
  applicableMetrics,
  researchPeriods,
  type FinancialGroup,
  type FinancialScope,
} from "@/lib/financial-catalog";
import { amount, percent } from "@/lib/format";
import { downloadCsv } from "./ResearchWorkbench";
import { Help } from "./Ui";
export default function FinancialDetailTable({
  research: r,
}: {
  research: Research;
}) {
  const [scope, setScope] = useState<FinancialScope>("annual"),
    [group, setGroup] = useState<FinancialGroup>("Profitability");
  const periods = useMemo(
    () => researchPeriods(r, scope).slice(-4),
    [r, scope],
  );
  const metrics = applicableMetrics(r).filter(
    (m) => m.group === group && periods.some((p) => p[m.key] != null),
  );
  return (
    <details className="financial-detail-table">
      <summary>Professional financial detail</summary>
      <header className="section-head">
        <div>
          <h3>Reported metrics & formulas</h3>
          <p>
            Only available, applicable metrics appear. Sector-specific
            exclusions remain.
          </p>
        </div>
        <div className="segments" aria-label="Financial detail period">
          {(["annual", "quarterly", "ttm"] as const).map((s) => (
            <button
              key={s}
              aria-pressed={scope === s}
              onClick={() => setScope(s)}
            >
              {s === "ttm" ? "TTM" : s === "annual" ? "Annual" : "Quarterly"}
            </button>
          ))}
        </div>
      </header>
      <div className="metric-groups" aria-label="Financial metric group">
        {(
          ["Essentials", "Profitability", "Cash flow", "Balance sheet"] as const
        ).map((g) => (
          <button
            className="text-button"
            key={g}
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>
      {metrics.length ? (
        <div className="table-scroll">
          <table>
            <caption>
              {scope.toUpperCase()} · {periods[0]?.currency} ·{" "}
              {periods[0]?.basis}. Observation periods are shown in column
              headers.
            </caption>
            <thead>
              <tr>
                <th>Metric</th>
                {periods.map((p) => (
                  <th key={p.end}>{p.end}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key}>
                  <th>
                    <Help label={m.label} trigger={m.label}>
                      <p>{m.help}</p>
                    </Help>
                  </th>
                  {periods.map((p) => {
                    const value = p[m.key];
                    return (
                      <td key={p.end}>
                        {value == null
                          ? "—"
                          : m.unit === "percent"
                            ? percent(value)
                            : m.unit === "ratio"
                              ? `${value.toFixed(2)}×`
                              : m.unit === "shares"
                                ? value.toLocaleString()
                                : amount(value, p.currency, m.unit === "money")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          No comparable {scope} values returned for this group. Other groups and
          periods remain selectable.
        </p>
      )}
      <button
        className="text-button"
        onClick={() =>
          downloadCsv(`${r.company.symbol}-${scope}-detail.csv`, [
            [
              "symbol",
              "period_start",
              "period_end",
              "currency",
              "basis",
              "metric",
              "value",
              "unit",
              "definition",
              "retrieved_at",
            ],
            ...periods.flatMap((p) =>
              applicableMetrics(r)
                .filter((m) => p[m.key] != null)
                .map((m) => [
                  r.company.symbol,
                  p.start,
                  p.end,
                  p.currency,
                  p.basis,
                  m.label,
                  p[m.key],
                  m.unit,
                  m.help,
                  r.retrievedAt,
                ]),
            ),
          ])
        }
      >
        Download all available financial metrics
      </button>
    </details>
  );
}
