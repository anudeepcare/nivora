"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import {
  overviewEvidence,
  companyMetricSelection,
} from "@/lib/overview-evidence";
import { headerMarketContext } from "@/lib/business-history";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, Source } from "./Ui";
import styles from "./CompanyMetrics.module.css";

export default function CompanyMetrics({ research }: { research: Research }) {
  const evidence = useMemo(
    () => overviewEvidence(research, { includeTechnical: false }),
    [research],
  );
  const market = headerMarketContext(research);
  const metrics = companyMetricSelection(
    evidence,
    market.marketCap == null ? 8 : 7,
  );
  if (!metrics.length && market.marketCap == null) return null;
  return (
    <section
      className={`${styles.metrics} company-metrics`}
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
              {m.sourceUrl && (
                <Source href={m.sourceUrl}>Source evidence</Source>
              )}
            </Help>
          </span>
          <strong className={`metric-tone-${m.tone}`}>
            {m.unit === "money"
              ? amount(m.value, m.currency, m.key !== "fcfPerShare")
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
    </section>
  );
}
