"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { latestFinancialEvidence } from "@/lib/analysis";
import { advancedStudies } from "@/lib/advanced-research";
import { amount, percent, dateLabel } from "@/lib/format";
export default function StockFacts({ research: r }: { research: Research }) {
  const s = useMemo(
    () => advancedStudies(r.history, r.retrievedAt),
    [r.history, r.retrievedAt],
  );
  const pe =
    r.company.assetType !== "crypto" ? r.evidence?.multiples?.ForwardPE : null;
  const reported =
    r.company.assetType === "stock" ? latestFinancialEvidence(r) : null;
  const p = reported?.latest,
    prior = reported?.prior;
  const ordinary = !/bank|insurance|reit/i.test(
    (r.company.sector ?? "") + " " + (r.evidence?.profile?.industry ?? ""),
  );
  const growth =
    p?.revenue != null && prior?.revenue != null && prior.revenue > 0
      ? (p.revenue / prior.revenue - 1) * 100
      : null;
  const margin =
    ordinary && p?.revenue != null && p.revenue > 0 && p.fcf != null
      ? (p.fcf / p.revenue) * 100
      : null;
  const businessRows = [
    {
      label: "Revenue growth",
      tone: growth != null && growth < 0 ? "risk" : "neutral",
      value: growth == null ? null : percent(growth),
      date: p?.end,
    },
    {
      label: "FCF margin",
      tone: margin != null && margin < 0 ? "risk" : "positive",
      value: margin == null ? null : percent(margin),
      date: p?.end,
    },
  ].filter((x) => x.value != null);
  const priceRows = [
    {
      label: "20-session move",
      tone: s.roc20 != null && s.roc20 < 0 ? "risk" : "positive",
      value: s.roc20 == null ? null : percent(s.roc20, true),
      date: s.asOf,
    },
    {
      label: "60-session move",
      tone: s.roc60 != null && s.roc60 < 0 ? "risk" : "positive",
      value: s.roc60 == null ? null : percent(s.roc60, true),
      date: s.asOf,
    },
    {
      label: "Daily traded value · 20",
      tone: "neutral",
      value:
        s.averageDollarVolume == null
          ? null
          : amount(s.averageDollarVolume, r.quote.currency, true),
      date: s.asOf,
    },
    {
      label: "Forward P/E",
      tone: "neutral",
      value:
        pe != null && Number.isFinite(pe) && pe > 0
          ? `${pe.toFixed(1)}×`
          : null,
      date: r.evidence?.updatedAt,
    },
  ].filter((x) => x.value != null);
  const rows = [...businessRows, ...priceRows].slice(0, 4);
  if (!rows.length) return null;
  return (
    <section
      className="stock-context-region"
      aria-label="Stock price and market context"
    >
      <dl className="stock-context-strip">
        {rows.map((x) => (
          <div
            key={x.label}
            data-tone={x.tone}
          >
            <dt>{x.label}</dt>
            <dd>{x.value}</dd>
          </div>
        ))}
      </dl>
      <p>
        {businessRows.length
          ? `Financial period ending ${dateLabel(p?.end)} · `
          : ""}
        Price history through {dateLabel(s.asOf)}
        {rows.some((x) => x.label === "Forward P/E")
          ? ` · P/E reported ${dateLabel(r.evidence?.updatedAt)}`
          : ""}
      </p>
    </section>
  );
}
