import type { Research } from "./types";
import { earningsCalendar } from "./earnings-calendar.ts";
import { researchBrief } from "./research-brief.ts";
export type AtlasTarget =
  | "Snapshot"
  | "Financials"
  | "Analysts"
  | "Valuation"
  | "Technicals"
  | "Thesis"
  | "News"
  | "Advanced"
  | "Pace"
  | "Options";
export type AtlasSignal = {
  label: string;
  value: number | null;
  valueLabel?: string;
  unit: "percent" | "money" | "number" | "count";
  detail: string;
  target: AtlasTarget;
  score: null;
};
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
export function referenceAtlas(research: Research) {
  const brief = researchBrief(research);
  const catalyst = earningsCalendar(research, Date.parse(research.retrievedAt));
  const holders = (research.evidence?.holders ?? []).filter(
    (row) => row.name && Number.isFinite(Date.parse(row.date)),
  );
  const cases =
    brief.scenarioEligible && brief.scenario
      ? [
          {
            label: "Bear",
            value: brief.scenario.low,
            annual: brief.scenario.annual.low,
            tone: "orange",
          },
          {
            label: "Base",
            value: brief.scenario.base,
            annual: brief.scenario.annual.base,
            tone: "cyan",
          },
          {
            label: "Bull",
            value: brief.scenario.high,
            annual: brief.scenario.annual.high,
            tone: "violet",
          },
        ].filter((row) => finite(row.value) !== null && row.value > 0)
      : [];
  const signals: AtlasSignal[] = [
    {
      label: "Business",
      value: finite(brief.businessNumbers.revenueGrowth),
      unit: "percent",
      detail: brief.business.reason,
      target: "Financials",
      score: null,
    },
    {
      label: "Value",
      value: cases.find((row) => row.label === "Base")?.value ?? null,
      unit: "money",
      detail: brief.value.reason,
      target: "Valuation",
      score: null,
    },
    {
      label: "Momentum",
      value: finite(brief.timing.rsi),
      unit: "number",
      detail:
        brief.timing.rsi == null
          ? "Completed price history is needed for RSI."
          : `RSI 14 · ${brief.timing.trend}. This is a price indicator, not a forecast.`,
      target: "Technicals",
      score: null,
    },
    {
      label: "Catalysts",
      value: null,
      valueLabel: catalyst.next?.date,
      unit: "count",
      detail: catalyst.next
        ? `Next scheduled earnings ${catalyst.next.date}; date may change. Calendar evidence updated ${catalyst.updatedAt}.`
        : catalyst.status,
      target: "News",
      score: null,
    },
    {
      label: "Ownership",
      value: null,
      valueLabel: "Not established",
      unit: "count",
      detail: holders.length
        ? `Comparable ownership trend is not established. ${holders.length} dated holder records are available; counts are not a directional signal.`
        : "Open Ownership to request institutional, insider and public filing evidence.",
      target: "Thesis",
      score: null,
    },
    {
      label: "Risk",
      value: null,
      unit: "number",
      detail: brief.risk,
      target: "Advanced",
      score: null,
    },
  ];
  const reading = brief.accumulation.forming ?? brief.accumulation;
  const multiplier = finite(reading.multiplier);
  return {
    brief,
    signals,
    cases,
    horizon: cases.length ? brief.scenario!.years : null,
    pace:
      multiplier !== null &&
      Number.isInteger(multiplier) &&
      multiplier >= 0 &&
      multiplier <= 4
        ? multiplier
        : null,
    paceState: brief.accumulation.forming ? "forming" : "confirmed",
    paceDate: reading.date,
    paceReason: reading.reason,
  };
}

/** Presentation precision only; original model horizon remains unchanged. */
export function atlasHorizonLabel(years: number | null | undefined): string {
  if (years == null || !Number.isFinite(years) || years <= 0) return "";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(years)} years`;
}
