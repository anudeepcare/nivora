"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { researchPeriods, type FinancialScope } from "@/lib/financial-catalog";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, DataStamp, Empty } from "./Ui";

export default function FinancialPicture({
  research: r,
}: {
  research: Research;
}) {
  const [scope, setScope] = useState<FinancialScope>(() =>
    researchPeriods(r, "ttm").length ? "ttm" : "annual",
  );
  const [statement, setStatement] = useState("Income");
  const periods = useMemo(() => researchPeriods(r, scope), [r, scope]);
  const p = periods.at(-1);
  const prior = p
    ? periods
        .filter((x) => {
          const days = (Date.parse(p.end) - Date.parse(x.end)) / 86400000;
          return days >= 330 && days <= 400 && x.currency === p.currency;
        })
        .at(-1)
    : undefined;
  const growth =
    p?.revenue != null && prior?.revenue != null && prior.revenue > 0
      ? (p.revenue / prior.revenue - 1) * 100
      : null;
  const metrics = [
    [
      "Revenue",
      amount(p?.revenue, p?.currency, true),
      growth == null
        ? "Reported sales"
        : `${percent(growth, true)} year over year`,
    ],
    ["Operating margin", percent(p?.margin), "Operating profitability"],
    [
      "Cash after capex",
      amount(p?.fcf, p?.currency, true),
      "Operating cash flow − capex",
    ],
    [
      "Net debt",
      amount(p?.netDebt, p?.currency, true),
      "Debt less reported cash",
    ],
  ];
  const rows =
    statement === "Income"
      ? [
          ["Revenue", amount(p?.revenue, p?.currency, true)],
          ["Operating margin", percent(p?.margin)],
          ["Net income", amount(p?.netIncome, p?.currency, true)],
          ["SBC / revenue", percent(p?.sbcRevenue)],
        ]
      : statement === "Cash flow"
        ? [
            ["Cash after capex", amount(p?.fcf, p?.currency, true)],
            ["Cash after capex / revenue", percent(p?.fcfMargin)],
            [
              "Operating cash flow",
              amount(p?.operatingCashFlow, p?.currency, true),
            ],
            ["Capital expenditure", amount(p?.capex, p?.currency, true)],
          ]
        : [
            ["Net debt", amount(p?.netDebt, p?.currency, true)],
            [
              "Current ratio",
              p?.currentRatio == null ? "—" : `${p.currentRatio.toFixed(1)}×`,
            ],
            ["Cash balance", amount(p?.cash, p?.currency, true)],
            ["Total debt", amount(p?.debt, p?.currency, true)],
          ];
  return (
    <section>
      <header className="section-head">
        <div>
          <h2>Financial picture</h2>
          <p>A few important numbers, with the detail underneath.</p>
        </div>
        <div className="segments" aria-label="Financial period">
          {(["ttm", "annual", "quarterly"] as const).map((v) => (
            <button
              key={v}
              className={scope === v ? "active" : ""}
              aria-pressed={scope === v}
              onClick={() => setScope(v)}
            >
              {v === "ttm" ? "TTM" : v === "annual" ? "Annual" : "Quarterly"}
            </button>
          ))}
        </div>
      </header>
      {p ? (
        <>
          <div className="metric-strip" style={{ marginTop: 0 }}>
            {metrics.map(([label, value, detail]) => (
              <div
                className="metric"
                data-tone={
                  label === "Revenue"
                    ? "blue"
                    : label === "Operating margin" && p.margin != null
                      ? p.margin >= 0
                        ? "green"
                        : "red"
                      : label === "Cash after capex" && p.fcf != null
                        ? p.fcf >= 0
                          ? "green"
                          : "red"
                        : "neutral"
                }
                key={label}
              >
                <Help label={label} trigger={label}>
                  <p>
                    {detail}.{" "}
                    {scope === "ttm"
                      ? "Trailing twelve months"
                      : scope === "annual"
                        ? "Annual financials"
                        : "Standalone quarter"}{" "}
                    ending {dateLabel(p.end)}, {p.currency}. Missing fields are
                    not assumed to be zero.
                  </p>
                </Help>
                <div className="metric-number num">{value}</div>
                <div className="metric-sub">{detail}</div>
              </div>
            ))}
          </div>
          <header className="section-head">
            <div>
              <h2>Statements</h2>
              <p>
                {scope.toUpperCase()} ended {dateLabel(p.end)} · {p.currency}
              </p>
            </div>
            <div className="segments" aria-label="Statement">
              {["Income", "Cash flow", "Balance sheet"].map((v) => (
                <button
                  key={v}
                  className={statement === v ? "active" : ""}
                  aria-pressed={statement === v}
                  onClick={() => setStatement(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </header>
          <table className="statement">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="shared-stamp">
            <DataStamp
              source={p.sourceUrl || p.basis}
              asOf={p.end}
              status={
                scope === "ttm"
                  ? "TTM financials"
                  : scope === "quarterly"
                    ? "Quarterly financials"
                    : "Annual financials"
              }
            />
          </div>
        </>
      ) : (
        <Empty title="No comparable financial periods returned">
          This period is unavailable. The other period buttons retain their own
          data.
        </Empty>
      )}
    </section>
  );
}
