import type { Research } from "./types";
import { modelCoverage } from "./research-depth.ts";
import {
  selectPriceReference,
  type PriceReference,
} from "./price-reference.ts";

export type RevenueSensitivityCase = {
  name: "Bear" | "Base" | "Bull";
  revenue: number;
  /** Relative to today's equity/revenue pricing; never an observed EV multiple. */
  relativePricingStress: number;
  target: number;
  change: number;
};
export type RevenueSensitivity =
  | { available: false; reason: string }
  | {
      available: true;
      basis: "revenue-sensitivity";
      cases: RevenueSensitivityCase[];
      reference: PriceReference;
      estimateCurrency: string;
      asOf: string;
      end: string;
      anchorRevenue: number;
      caveat: string;
    };
const DAY = 86400000;
const currencies = new Set(
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("currency")
    : [],
);
const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x > 0;
const calendarDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** Same-fiscal-period revenue dispersion around today's price, not intrinsic value.
 * No EV, cash/debt, FX conversion, share count or historical valuation is inferred.
 * Callers preserve qualifying earnings/cash-flow models before using this fallback.
 */
export function revenueSensitivity(
  r: Research,
  options: { fiscalEnd?: string } = {},
): RevenueSensitivity {
  const unavailable = (reason: string): RevenueSensitivity => ({
    available: false,
    reason,
  });
  const family = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  }).family;
  if (
    r.company.assetType !== "stock" ||
    !["operating-company", "infrastructure", "frontier"].includes(family)
  )
    return unavailable(
      "This business requires a specialist model; a generic revenue sensitivity is not supplied.",
    );
  const e = r.evidence;
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const observed = Date.parse(e?.updatedAt ?? "");
  if (
    !e ||
    !Number.isFinite(now) ||
    !Number.isFinite(observed) ||
    observed > now ||
    now - observed > 120 * DAY
  )
    return unavailable(
      "A revenue forecast dataset observed within the past 120 days is required.",
    );
  const reference = selectPriceReference(r, now);
  if (!reference || !currencies.has(reference.currency))
    return unavailable(
      "A verified recent price in the listing currency is required.",
    );
  const annual = (e.estimates ?? [])
    .filter((x) => {
      const days = (Date.parse(x.date) - now) / DAY;
      const fiscal = /^FY(\d{4})$/i.exec(x.period);
      return (
        /^(?:annual|yearly)$/i.test(x.frequency) &&
        calendarDate(x.date) &&
        days >= 90 &&
        days <= 1461 &&
        (!fiscal ||
          Math.abs(Number(fiscal[1]) - Number(x.date.slice(0, 4))) <= 1) &&
        !/^[-+]?\d+q$/i.test(x.period) &&
        !!x.currency &&
        currencies.has(x.currency) &&
        positive(x.revenueLow) &&
        positive(x.revenue) &&
        positive(x.revenueHigh) &&
        x.revenueLow <= x.revenue &&
        x.revenue <= x.revenueHigh
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const estimate = options.fiscalEnd
    ? annual.find((x) => x.date === options.fiscalEnd)
    : annual[0];
  if (!estimate)
    return unavailable(
      "A complete positive annual revenue low/base/high range dated 90 days to four years ahead is required.",
    );
  const sameEnd = annual.filter((x) => x.date === estimate.date);
  if (
    sameEnd.some(
      (x) =>
        x.currency !== estimate.currency ||
        x.revenueLow !== estimate.revenueLow ||
        x.revenue !== estimate.revenue ||
        x.revenueHigh !== estimate.revenueHigh,
    )
  )
    return unavailable(
      "Conflicting annual revenue observations for this fiscal end need reconciliation.",
    );
  const anchorRevenue = estimate.revenue!;
  const cases: RevenueSensitivityCase[] = (
    [
      ["Bear", estimate.revenueLow!, 0.8],
      ["Base", anchorRevenue, 1],
      ["Bull", estimate.revenueHigh!, 1.2],
    ] as const
  ).map(([name, revenue, relativePricingStress]) => {
    const target =
      reference.price * (revenue / anchorRevenue) * relativePricingStress;
    return {
      name,
      revenue,
      relativePricingStress,
      target,
      change: (target / reference.price - 1) * 100,
    };
  });
  if (!cases.every((x) => positive(x.target) && Number.isFinite(x.change)))
    return unavailable(
      "These inputs do not produce finite positive price sensitivities.",
    );
  return {
    available: true,
    basis: "revenue-sensitivity",
    cases,
    reference,
    estimateCurrency: estimate.currency!,
    asOf: e.updatedAt!,
    end: estimate.date,
    anchorRevenue,
    caveat:
      "Price-anchored revenue sensitivity: each supplied annual revenue case is divided by the mean for that same fiscal year, then multiplied by today's selected price and a relative pricing stress of 0.8× / 1× / 1.2×. Base is a neutral price anchor exactly equal to the reference, not the most likely outcome. Constant FX, share count and listing/ADR ratio are assumed. These are relative equity/revenue pricing stresses, not observed EV/revenue multiples. Financing proceeds, dilution, cash, debt, profitability and execution costs are not modeled. The dataset observation date does not establish when each analyst revised an estimate. These conditional sensitivities are not independent fair value, analyst price targets, probabilities or validated forecasts.",
  };
}
