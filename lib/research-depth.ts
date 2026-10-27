import type { Fact, Candle, FinancialPeriod } from "./types";
import { financialPeriods, cashFlowValue } from "./engine.ts";
import { flowFields, withFinancialRatios } from "./financial-formulas.ts";
import {
  compareFinancialFacts,
  compareFinancialPeriods,
} from "./financial-period-selection.ts";
const DAY = 86400000;
export function quarterFacts(facts: Fact[], asOf: string): Fact[] {
  const day = asOf.slice(0, 10),
    latest = new Map<string, Fact>();
  const rows = facts
    .filter(
      (f) =>
        f.start && f.end <= day && f.filed <= day && Number.isFinite(f.value),
    )
    .sort((a, b) => compareFinancialFacts(b, a));
  for (const f of rows)
    latest.set(
      [f.metric, f.start, f.end, f.unit, f.currency, f.basis].join("|"),
      f,
    );
  const known = [...latest.values()],
    result = known.filter((f) => f.scope === "quarterly");
  for (const f of known) {
    if (
      !["ytd", "annual"].includes(f.scope) ||
      !f.start ||
      ["eps", "shares", "weightedShares"].includes(f.metric)
    )
      continue;
    const previous = known
      .filter(
        (p) =>
          p.metric === f.metric &&
          p.start === f.start &&
          p.end < f.end &&
          p.unit === f.unit &&
          p.currency === f.currency &&
          p.basis === f.basis &&
          p.filed <= f.filed,
      )
      .sort((a, b) => a.end.localeCompare(b.end))
      .at(-1);
    if (!previous || !previous.start) continue;
    const start = new Date(Date.parse(previous.end) + DAY)
        .toISOString()
        .slice(0, 10),
      duration = (Date.parse(f.end) - Date.parse(start)) / DAY;
    if (
      duration < 60 ||
      duration > 110 ||
      result.some(
        (p) =>
          p.metric === f.metric &&
          p.start === start &&
          p.end === f.end &&
          p.unit === f.unit &&
          p.currency === f.currency &&
          p.basis === f.basis,
      )
    )
      continue;
    result.push({
      ...f,
      id: `derived:${f.id}:${previous.id}`,
      start,
      value: f.value - previous.value,
      scope: "quarterly",
      accession: `derived:${f.accession}:${previous.accession}`,
      derivedFrom: [f.id, previous.id],
      sourceUrls: [f.sourceUrl, previous.sourceUrl],
    });
  }
  return result.sort(
    (a, b) => a.end.localeCompare(b.end) || a.metric.localeCompare(b.metric),
  );
}
export function ttmPeriods(facts: Fact[], asOf: string): FinancialPeriod[] {
  const rows = financialPeriods(
      [
        ...quarterFacts(facts, asOf),
        ...facts.filter((f) => f.scope === "instant"),
      ],
      "quarterly",
      asOf,
    ),
    result: FinancialPeriod[] = [];
  const series = new Map<string, Map<string, FinancialPeriod>>();
  for (const row of rows) {
    const key = `${row.currency}|${row.basis}`;
    if (!series.has(key)) series.set(key, new Map());
    // financialPeriods puts the more complete tied-end observation last.
    series.get(key)!.set(row.end, row);
  }
  for (const periods of series.values()) {
    const comparable = [...periods.values()].sort(compareFinancialPeriods);
    for (let i = 3; i < comparable.length; i++) {
      const four = comparable.slice(i - 3, i + 1),
        last = four[3];
      if (
        four.some(
          (r, j) =>
            r.currency !== last.currency ||
            r.basis !== last.basis ||
            (j > 0 &&
              Date.parse(r.start) !== Date.parse(four[j - 1].end) + DAY),
        )
      )
        continue;
      const span = (Date.parse(last.end) - Date.parse(four[0].start)) / DAY;
      if (span < 330 || span > 400) continue;
      const sum = (
        key:
          | "revenue"
          | "netIncome"
          | "operatingIncome"
          | "operatingCashFlow"
          | "capex"
          | "fcf",
      ) =>
        four.every((r) => r[key] != null)
          ? four.reduce((s, r) => s + r[key]!, 0)
          : null;
      const revenue = sum("revenue"),
        op = sum("operatingIncome");
      const extended = Object.fromEntries(
        flowFields.map((k) => [
          k,
          four.every((r) => r[k] != null)
            ? four.reduce((s, r) => s + r[k]!, 0)
            : null,
        ]),
      );
      const days = four.map(
        (r) => (Date.parse(r.end) - Date.parse(r.start)) / DAY + 1,
      );
      const weights = four.every(
        (r) => r.weightedShares != null && r.weightedShares > 0,
      )
        ? four.reduce((s, r, j) => s + r.weightedShares! * days[j], 0) /
          days.reduce((s, n) => s + n, 0)
        : null;
      result.push(
        withFinancialRatios({
          ...last,
          start: four[0].start,
          revenue,
          netIncome: sum("netIncome"),
          operatingIncome: op,
          operatingCashFlow: sum("operatingCashFlow"),
          capex: sum("capex"),
          fcf: sum("fcf"),
          margin: revenue && op != null ? (op / revenue) * 100 : null,
          ...extended,
          weightedShares: weights,
          eps: null,
          sourceUrls: [
            ...new Set(four.flatMap((r) => r.sourceUrls ?? [r.sourceUrl])),
          ],
        }),
      );
    }
  }
  return result.sort(compareFinancialPeriods);
}
export function reverseGrowth(
  cash: number,
  shares: number,
  price: number,
  discount: number,
  terminal: number,
  dilution: number,
): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  let low = -70,
    high = 100;
  const l = cashFlowValue(cash, shares, low, discount, terminal, dilution),
    h = cashFlowValue(cash, shares, high, discount, terminal, dilution);
  if (l == null || h == null || price < l || price > h) return null;
  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2,
      value = cashFlowValue(cash, shares, mid, discount, terminal, dilution);
    if (value == null) return null;
    if (value > price) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}
export function weeklyStudies(
  bars: Candle[],
  asOf: string,
): { ma50: number | null; ma200: number | null; last: string | null } {
  const day = new Date(asOf);
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const boundary = day.toISOString().slice(0, 10),
    weeks = new Map<string, Candle>();
  for (const b of [...bars].sort((a, b) => a.time.localeCompare(b.time))) {
    if (
      b.time.length !== 10 ||
      b.time >= boundary ||
      !Number.isFinite(b.close) ||
      b.close <= 0
    )
      continue;
    const d = new Date(b.time);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    weeks.set(d.toISOString().slice(0, 10), b);
  }
  const rows = [...weeks.values()],
    average = (n: number) =>
      rows.length >= n &&
      (Date.parse(rows.at(-1)!.time) - Date.parse(rows.at(-n)!.time)) / DAY <=
        (n - 1) * 7 + 5
        ? rows.slice(-n).reduce((s, b) => s + b.close, 0) / n
        : null;
  return {
    ma50: average(50),
    ma200: average(200),
    last: rows.at(-1)?.time ?? null,
  };
}
export function modelCoverage(
  symbol: string,
  assetType: string,
  profile?: { sector?: string | null; industry?: string | null },
): {
  family: string;
  drivers: string[];
  method: string;
  classificationSource:
    | "asset-type"
    | "provider-profile"
    | "known-symbol"
    | "fallback";
} {
  if (assetType === "crypto")
    return {
      family: "crypto",
      classificationSource: "asset-type",
      drivers: [
        "Network usage",
        "Supply and issuance",
        "Liquidity",
        "Custody and protocol risks",
      ],
      method: "Corporate cash-flow valuation does not apply.",
    };
  const knownInfrastructure = ["IREN", "CIFR", "CORZ", "CRWV", "NBIS"].includes(
    symbol,
  );
  const infrastructureIndustry =
    /\bdata[ -]?cent(?:er|re)s?\b|\b(?:bitcoin|cryptocurrency|digital asset) mining\b/i.test(
      profile?.industry ?? "",
    );
  if (knownInfrastructure || infrastructureIndustry)
    return {
      family: "infrastructure",
      classificationSource: knownInfrastructure
        ? "known-symbol"
        : "provider-profile",
      drivers: [
        "Contracted versus operating capacity",
        "Power and utilization",
        "Customer concentration",
        "Equipment economics and capex",
        "Funding, dilution and legacy segments",
      ],
      method:
        "Capacity and financing scenarios; a generic current-FCF extrapolation is insufficient.",
    };
  if (["ASTS", "RKLB", "JOBY", "ACHR"].includes(symbol))
    return {
      family: "frontier",
      classificationSource: "known-symbol",
      drivers: [
        "Deployment and usable capacity",
        "Commercial conversion",
        "Regulatory dependencies",
        "Cash runway and financing",
        "Delivered milestones versus targets",
      ],
      method:
        "Milestone and unit-economics scenarios; no automatic intrinsic value from current losses.",
    };
  const label = (value?: string | null) =>
      (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    sector = label(profile?.sector),
    industry = label(profile?.industry),
    hasProfile = !!(sector || industry);
  // Provider classifications guard model suitability; they do not supply a
  // validated valuation model or company-specific assumptions.
  if (
    /\breits?\b|\breal estate investment trusts?\b/.test(industry) ||
    sector === "real estate"
  )
    return {
      family: "real-estate",
      classificationSource: "provider-profile",
      drivers: [
        "Property income and occupancy",
        "FFO and AFFO reconciliation",
        "Leverage and refinancing",
        "Maintenance capital expenditure",
        "Portfolio value and lease terms",
      ],
      method:
        "Property/REIT-specific valuation is not available; FFO/AFFO, asset values and leverage need dedicated review before selecting a valuation method.",
    };
  if (
    (/\binsurance\b/.test(industry) && !/\bbrokers?\b/.test(industry)) ||
    /\bhealth ?care plans?\b/.test(industry) ||
    sector === "insurance"
  )
    return {
      family: "insurance",
      classificationSource: "provider-profile",
      drivers: [
        "Underwriting or medical claims economics",
        "Claims and reserve adequacy",
        "Regulatory capital and liquidity",
        "Investment portfolio",
        "Policy retention and pricing",
      ],
      method:
        "Insurance-specific valuation is not available; claims, reserves and regulatory capital require dedicated review rather than a generic cash-flow or bank scenario.",
    };
  if (
    (/\bbanks?\b|\bthrifts?\b|\bsavings (?:and )?loans?\b/.test(industry) &&
      !/\binvestment banks?\b/.test(industry)) ||
    industry === "banking" ||
    (!hasProfile &&
      ["JPM", "BAC", "WFC", "C", "GS", "MS", "SCHW", "NU", "SOFI"].includes(
        symbol,
      ))
  )
    return {
      family: "financial",
      classificationSource: hasProfile ? "provider-profile" : "known-symbol",
      drivers: [
        "Return on tangible equity",
        "Capital adequacy",
        "Credit quality",
        "Funding cost",
        "Tangible book value",
      ],
      method:
        "Residual income / tangible-book scenarios; operating cash flow is not a suitable bank valuation anchor.",
    };
  if (
    /\bfinancials?\b|\bfinance\b/.test(sector) ||
    /\bfinancial\b|\bfinance\b|\binsurance\b|\basset management\b|\bcapital markets\b|\bcredit services\b|\binvestment bank(?:s|ing)?\b/.test(
      industry,
    )
  )
    return {
      family: "specialized-financial",
      classificationSource: "provider-profile",
      drivers: [
        "Business mix and revenue sources",
        "Capital and liquidity requirements",
        "Credit and market exposure",
        "Customer assets and obligations",
        "Sustainable earnings and distributions",
      ],
      method:
        "A sector-specific valuation is not available; generic operating cash flow and bank tangible-book assumptions should not be applied automatically.",
    };
  return {
    family: "operating-company",
    classificationSource: hasProfile ? "provider-profile" : "fallback",
    drivers: [
      "Revenue durability",
      "Margins and cash conversion",
      "Reinvestment",
      "Balance-sheet claims",
      "Competitive advantage and dilution",
    ],
    method: hasProfile
      ? "Cash-flow sensitivity when positive cash flow and reconciled shares are available."
      : "Business classification is unavailable; generic cash-flow sensitivity is provisional and requires model suitability review.",
  };
}
