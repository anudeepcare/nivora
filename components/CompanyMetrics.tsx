"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { overviewEvidence } from "@/lib/overview-evidence";
import { headerMarketContext } from "@/lib/business-history";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";

export default function CompanyMetrics({ research }: { research: Research }) {
  const [expanded, setExpanded] = useState(false);
  const evidence = useMemo(() => overviewEvidence(research), [research]);
  const market = headerMarketContext(research);
  const keys = evidence.specialist
    ? ["revenueGrowth", "roe", "netIncome", "cash", "debt", "roa"]
    : [
        "revenueGrowth",
        "operatingMargin",
        "fcf",
        "cash",
        "netDebt",
        "operatingRunway",
        "operatingCashFlow",
      ];
  const metrics = keys
    .flatMap((key) => evidence.business.filter((m) => m.key === key))
    .slice(0, market.marketCap == null ? 7 : 6);
  const multiple = evidence.valuation.find(
    (m) => m.unit === "ratio" && m.value > 0,
  );
  if (multiple) metrics.push(multiple);
  if (!metrics.length && market.marketCap == null) return null;
  return (
    <section
      className={`company-metrics${expanded ? " company-metrics-expanded" : ""}`}
      aria-label="Company key metrics"
    >
      {market.marketCap != null && (
        <div>
          <span>
            Market cap{" "}
            <Help label="Market capitalization">
              <p>
                Reported equity market value · {dateLabel(market.asOf)}. It is a
                dated snapshot and may differ from shares multiplied by the
                latest trade.
              </p>
            </Help>
          </span>
          <strong>{amount(market.marketCap, market.currency, true)}</strong>
          <small>{dateLabel(market.asOf)}</small>
        </div>
      )}
      {metrics.map((m) => (
        <div key={m.key}>
          <span>
            {m.label}
            <Help label={m.label}>
              <p>{m.help}</p>
            </Help>
          </span>
          <strong className={`metric-tone-${m.tone}`}>
            {m.unit === "money"
              ? amount(m.value, m.currency, true)
              : m.unit === "percent"
                ? percent(m.value)
                : m.unit === "ratio"
                  ? `${m.value.toFixed(1)}×`
                  : m.value.toFixed(1)}
          </strong>
          <small>
            {m.period
              ? `${m.periodBasis ?? "Reported"} · ${dateLabel(m.period)}`
              : "Update date unavailable"}
          </small>
        </div>
      ))}
      {metrics.length + (market.marketCap != null ? 1 : 0) > 4 && (
        <button
          className="company-metrics-toggle text-link"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Fewer metrics" : "More company metrics"}
        </button>
      )}
    </section>
  );
}
