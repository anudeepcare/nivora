"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { researchPeriods, type FinancialScope } from "@/lib/financial-catalog";
import { amount, percent, dateLabel } from "@/lib/format";
import FinancialDetailTable from "./FinancialDetailTable";
import FinancialExplorer from "./FinancialExplorer";
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
  const detailGroups = [
    {
      title: "Profitability",
      rows: [
        ["Gross margin", p?.grossMargin, "percent", "Gross profit ÷ revenue."],
        ["Net margin", p?.netMargin, "percent", "Net income ÷ revenue."],
        [
          "Cash-flow margin",
          p?.fcfMargin,
          "percent",
          "Operating cash flow less capex, divided by revenue.",
        ],
      ],
    },
    {
      title: "Reinvestment",
      rows: [
        [
          "Capex / revenue",
          p?.capexRevenue,
          "percent",
          "Absolute capital expenditure ÷ revenue.",
        ],
        [
          "Stock compensation / revenue",
          p?.sbcRevenue,
          "percent",
          "Reported stock compensation ÷ revenue; not actual share dilution.",
        ],
        [
          "Cash flow / diluted share",
          p?.fcfPerShare,
          "money",
          "Operating cash flow less capex, divided by weighted shares.",
        ],
      ],
    },
    {
      title: "Balance sheet",
      rows: [
        [
          "Current ratio",
          p?.currentRatio,
          "ratio",
          "Current assets ÷ current liabilities.",
        ],
        [
          "Debt / equity",
          p?.debtEquity,
          "ratio",
          "Reported debt ÷ positive book equity.",
        ],
        [
          "Interest coverage",
          p?.interestCoverage,
          "ratio",
          "Operating income ÷ interest expense.",
        ],
      ],
    },
  ];
  const interpretation = (label: string, value: number) => {
    if (label === "Gross margin")
      return "Revenue retained after direct costs; compare with similar businesses.";
    if (label === "Net margin")
      return value < 0
        ? "The period ended in an accounting loss."
        : "Profit remaining after expenses, interest and tax.";
    if (label === "Cash-flow margin")
      return value < 0
        ? "Investment and operating cash needs exceeded operating cash generation."
        : "Cash remaining after reported capital expenditure, before financing.";
    if (label === "Current ratio")
      return value >= 1
        ? "Current assets exceed current liabilities; timing and asset quality still matter."
        : "Current liabilities exceed current assets; inspect liquidity and funding.";
    if (label === "Interest coverage")
      return value >= 2
        ? "Operating earnings cover reported interest more than twice."
        : "A thin earnings buffer for reported interest costs.";
    if (label === "Stock compensation / revenue")
      return "Non-cash employee compensation; inspect share-count change separately.";
    if (label === "Capex / revenue")
      return "Share of sales reinvested in reported capital assets.";
    if (label === "Debt / equity")
      return "Debt relative to book equity; industry and lease treatment affect comparison.";
    return "Cash generated per diluted weighted share in this reporting period.";
  };
  const bridge =
    p?.operatingCashFlow != null &&
    p.capex != null &&
    p.fcf != null &&
    Math.abs(p.operatingCashFlow - Math.abs(p.capex) - p.fcf) <=
      Math.max(1, Math.abs(p.operatingCashFlow)) * 0.001
      ? [
          {
            label: "Operating cash",
            value: p.operatingCashFlow,
            from: 0,
            to: p.operatingCashFlow,
            tone: "blue",
          },
          {
            label: "Capital spending",
            value: -Math.abs(p.capex),
            from: p.operatingCashFlow,
            to: p.fcf,
            tone: "red",
          },
          {
            label: "Cash after capex",
            value: p.fcf,
            from: 0,
            to: p.fcf,
            tone: p.fcf! < 0 ? "red" : p.fcf! > 0 ? "green" : "neutral",
          },
        ]
      : [];
  const bridgeLow = Math.min(0, ...bridge.flatMap((x) => [x.from, x.to])),
    bridgeHigh = Math.max(0, ...bridge.flatMap((x) => [x.from, x.to]));
  const bridgeY = (value: number) =>
    115 - ((value - bridgeLow) / Math.max(1e-9, bridgeHigh - bridgeLow)) * 80;
  return (
    <section className="financial-picture depth-financial">
      <header className="section-head">
        <div>
          <h2>Financials</h2>
          <p>Reported performance and financial position.</p>
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
          <div className="financial-answer">
            <div>
              <span className="eyebrow">THE FINANCIAL PICTURE</span>
              <strong>
                {p.fcf != null
                  ? p.fcf >= 0
                    ? "The business generated cash after reported capital spending."
                    : "Cash needs exceeded generation after reported capital spending."
                  : "Read profit, investment needs and funding together."}
              </strong>
              <p>
                {p.margin != null
                  ? `${percent(p.margin)} operating margin. `
                  : ""}
                {growth != null
                  ? `${percent(growth, true)} comparable revenue growth. `
                  : ""}
                Use the chart to see whether the pattern is persistent.
              </p>
            </div>
            {bridge.length > 0 && (
              <figure className="financial-cash-bridge">
                <figcaption>
                  From operating cash to cash after capex · {p.currency}
                </figcaption>
                <svg
                  viewBox="0 0 480 155"
                  role="img"
                  aria-label="Operating cash flow less capital spending equals cash after capex"
                >
                  <line
                    x1="15"
                    x2="465"
                    y1={bridgeY(0)}
                    y2={bridgeY(0)}
                    stroke="var(--line)"
                  />
                  {bridge.map((item, i) => (
                    <g key={item.label} data-tone={item.tone}>
                      <title>{`${item.label}: ${amount(item.value, p.currency, true)}`}</title>
                      <rect
                        x={35 + i * 155}
                        y={Math.min(bridgeY(item.from), bridgeY(item.to))}
                        width="90"
                        height={Math.max(
                          1,
                          Math.abs(bridgeY(item.from) - bridgeY(item.to)),
                        )}
                        rx="4"
                      />
                      <text
                        x={80 + i * 155}
                        y={Math.max(
                          19,
                          Math.min(bridgeY(item.from), bridgeY(item.to)) - 8,
                        )}
                        textAnchor="middle"
                      >
                        {amount(item.value, p.currency, true)}
                      </text>
                      <text x={80 + i * 155} y="145" textAnchor="middle">
                        {item.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </figure>
            )}
          </div>
          <FinancialExplorer research={r} scope={scope} />
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
          <dl
            className="statement-snapshot"
            aria-label={`${statement} statement snapshot`}
          >
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="num">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="financial-detail-groups">
            {detailGroups.map((group) => {
              const available = group.rows.filter(
                ([, value]) =>
                  typeof value === "number" && Number.isFinite(value),
              );
              return available.length ? (
                <section key={group.title} data-group={group.title}>
                  <h3>{group.title}</h3>
                  <div className="detail-metric-grid">
                    {available.map(([label, value, unit, help]) => (
                      <div className="detail-metric" key={String(label)}>
                        <Help label={String(label)} trigger={String(label)}>
                          <p>{String(help)}</p>
                          <p>
                            Uses the selected financial period. Definitions and
                            sector relevance matter; a ratio alone does not
                            determine a buy or sell.
                          </p>
                        </Help>
                        <strong
                          className={`num ${Number(value) < 0 ? "negative" : ""}`}
                        >
                          {unit === "percent"
                            ? percent(Number(value))
                            : unit === "money"
                              ? amount(Number(value), p.currency)
                              : `${Number(value).toFixed(1)}×`}
                        </strong>
                        <small>
                          {interpretation(String(label), Number(value))}
                        </small>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
            })}
          </div>
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
      <FinancialDetailTable research={r} />
    </section>
  );
}
