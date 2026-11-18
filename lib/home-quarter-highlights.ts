import { financialPeriods } from "./engine.ts";
import { selectFinancialPeriod } from "./financial-period-selection.ts";
import type { Research } from "./types";
/** Adjacent reported-quarter revenue only. Never current-calendar-quarter estimates. */
export function homeQuarterHighlights(research: Research[], asOf: string) {
  if (!Number.isFinite(Date.parse(asOf))) return [];
  return research
    .flatMap((r) => {
      const cutoff = r.retrievedAt < asOf ? r.retrievedAt : asOf;
      // Period provenance must belong to revenue, not a later filing of another metric.
      const revenueFacts = r.facts.filter(
        (f) =>
          f.metric === "revenue" &&
          f.currency !== null &&
          f.unit === f.currency,
      );
      const rows = financialPeriods(revenueFacts, "quarterly", cutoff);
      const latest = selectFinancialPeriod(
        rows,
        r.evidence?.reportingCurrency ?? r.quote.currency,
      );
      if (!latest || latest.revenue === null || latest.revenue < 0) return [];
      const prior = selectFinancialPeriod(
        rows.filter(
          (p) =>
            p.end < latest.end &&
            p.currency === latest.currency &&
            p.basis === latest.basis,
        ),
        latest.currency,
      );
      if (!prior || prior.revenue === null || prior.revenue <= 0) return [];
      const day = 86400000,
        gap = (Date.parse(latest.start) - Date.parse(prior.end)) / day;
      const duration = (p: typeof latest) =>
        (Date.parse(p.end) - Date.parse(p.start)) / day;
      if (
        gap < 1 ||
        gap > 8 ||
        Math.abs(duration(latest) - duration(prior)) > 14
      )
        return [];
      // Conflicting values within the same latest filing cannot be a confident headline.
      for (const p of [prior, latest]) {
        const matching = revenueFacts.filter(
          (f) =>
            f.metric === "revenue" &&
            f.scope === "quarterly" &&
            f.start === p.start &&
            f.end === p.end &&
            f.currency === p.currency &&
            f.basis === p.basis &&
            f.filed === p.filed,
        );
        if (new Set(matching.map((f) => f.value)).size > 1) return [];
      }
      const changePct = (latest.revenue / prior.revenue - 1) * 100;
      if (!Number.isFinite(changePct)) return [];
      const safe = (value: string) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" && !url.username && !url.password
            ? value
            : null;
        } catch {
          return null;
        }
      };
      return [
        {
          symbol: r.company.symbol,
          name: r.company.name,
          from: prior.end,
          to: latest.end,
          filed: latest.filed,
          current: latest.revenue,
          previous: prior.revenue,
          currency: latest.currency,
          basis: latest.basis,
          changePct,
          source: safe(latest.sourceUrl),
          priorSource: safe(prior.sourceUrl),
        },
      ];
    })
    .sort(
      (a, b) =>
        b.filed.localeCompare(a.filed) || a.symbol.localeCompare(b.symbol),
    )
    .slice(0, 3);
}
