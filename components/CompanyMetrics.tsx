"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { overviewEvidence } from "@/lib/overview-evidence";
import { headerMarketContext } from "@/lib/business-history";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";

export default function CompanyMetrics({ research }: { research: Research }) {
  const evidence = useMemo(() => overviewEvidence(research), [research]);
  const market = headerMarketContext(research);
  const keys = evidence.specialist
    ? ["revenueGrowth", "roe", "netIncome", "cash"]
    : ["revenueGrowth", "operatingMargin", "fcf", "cash"];
  const metrics = keys
    .flatMap((key) => evidence.business.filter((m) => m.key === key))
    .slice(0, 3);
  const multiple = evidence.valuation.find(
    (m) => m.unit === "ratio" && m.value > 0,
  );
  if (multiple) metrics.push(multiple);
  if (!metrics.length && market.marketCap == null) return null;
  return (
    <section className="company-metrics" aria-label="Company key metrics">
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
              : "Dated snapshot"}
          </small>
        </div>
      ))}
    </section>
  );
}
