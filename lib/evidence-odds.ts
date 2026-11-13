import type { Research } from "./types";
import { settledPriceBars } from "./price-reference.ts";
import {
  EVIDENCE_TABLE,
  EVIDENCE_PERIOD,
  type EvidenceCell,
} from "./evidence-table.ts";

export type BusinessState = "pass" | "mixed" | "fail";
export type EvidenceOdds = {
  business: BusinessState;
  trend: "up" | "down";
  /** Percent below the highest close of the past year. */
  offHigh: number;
  cell: EvidenceCell;
  /** A narrower state that also applies, when it changes the picture. */
  modifier: { label: string; cell: EvidenceCell } | null;
  all: EvidenceCell;
  grade: "favourable" | "neutral" | "unfavourable";
  headline: string;
  detail: string;
};
type Numbers = {
  operatingMargin: number | null;
  fcf: number | null;
  dilution: number | null | undefined;
  revenueGrowth: number | null;
};
const num = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

/** Study business categories; incomplete passing checks remain unknown. */
export function businessState(b: Numbers): BusinessState | null {
  if (!num(b.operatingMargin) || !num(b.fcf)) return null;
  if (
    b.operatingMargin > 0 &&
    b.fcf > 0 &&
    (!num(b.dilution) || !num(b.revenueGrowth)) &&
    !(num(b.dilution) && b.dilution > 10) &&
    !(num(b.revenueGrowth) && b.revenueGrowth <= -5)
  )
    return null;
  if (
    b.operatingMargin > 0 &&
    b.fcf > 0 &&
    num(b.dilution) &&
    b.dilution <= 10 &&
    num(b.revenueGrowth) &&
    b.revenueGrowth > -5
  )
    return "pass";
  return b.operatingMargin < 0 && b.fcf < 0 ? "fail" : "mixed";
}

/** Measured one-year record of stocks that were in the same state as this one:
 * business check result, and price above or below its 200-day average.
 * A description of what happened to similar cases, not a forecast for this stock. */
export function evidenceOdds(
  r: Research,
  b: Numbers,
  now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
): EvidenceOdds | null {
  if (r.company.assetType !== "stock") return null;
  const business = businessState(b);
  const bars = settledPriceBars(r, now);
  const lastBar = bars.at(-1);
  if (
    !business ||
    bars.length < 252 ||
    !lastBar ||
    now - Date.parse(lastBar.time) > 4 * 86400000
  )
    return null;
  const closes = bars.map((x) => x.close);
  const last = closes.at(-1)!;
  const average = closes.slice(-200).reduce((a, x) => a + x, 0) / 200;
  const trend = last > average ? "up" : "down";
  const offHigh = (1 - last / Math.max(...closes.slice(-252))) * 100;
  const cell = EVIDENCE_TABLE[`${business}:${trend}`],
    all = EVIDENCE_TABLE.all;
  if (!cell || !all) return null;
  const modifier =
    business === "pass" && offHigh >= 30
      ? {
          label: "30% or more below their one-year high",
          cell: EVIDENCE_TABLE["pass:deep"],
        }
      : business === "pass" && offHigh < 5
        ? {
            label: "within 5% of their one-year high",
            cell: EVIDENCE_TABLE["pass:nearHigh"],
          }
        : null;
  const use = modifier?.cell ?? cell;
  const grade =
    use.beat >= 57 ? "favourable" : use.beat >= 47 ? "neutral" : "unfavourable";
  const state = `${
    business === "pass"
      ? "passing the business check"
      : business === "fail"
        ? "failing the business check"
        : "with a mixed business check"
  } and trading ${trend === "up" ? "above" : "below"} their 200-day average`;
  return {
    business,
    trend,
    offHigh,
    cell,
    modifier,
    all,
    grade,
    headline:
      grade === "favourable"
        ? "The record for stocks like this is favourable"
        : grade === "neutral"
          ? "The record for stocks like this is about average"
          : "The record for stocks like this is poor",
    detail: `Companies ${state} were higher a year later ${cell.win.toFixed(0)}% of the time and beat the typical stock ${cell.beat.toFixed(0)}% of the time (${cell.n.toLocaleString("en-US")} cases, ${EVIDENCE_PERIOD}; all stocks: ${all.win.toFixed(0)}%).${
      modifier
        ? ` Those ${modifier.label}: ${modifier.cell.win.toFixed(0)}% higher, ${modifier.cell.beat.toFixed(0)}% beat the typical stock.`
        : ""
    } One year in ten was worse than ${use.bad.toFixed(0)}%.`,
  };
}
