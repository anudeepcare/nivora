import { modelCoverage, ttmPeriods } from "./research-depth.ts";
import type { Research } from "./types";

export type OutlookCase = {
  name: "Bear" | "Base" | "Bull";
  eps: number | null;
  revenue?: number;
  dilution?: number;
  multiple: number;
  target: number;
  change: number;
  annual: number;
};
export type Outlook =
  | { available: false; reason: string }
  | {
      available: true;
      cases: OutlookCase[];
      years: number;
      period: string;
      end: string;
      asOf: string;
      currency: string;
      analysts: number | null;
      forwardPE: number;
      basis?: "earnings" | "revenue";
      shares?: number;
      netDebt?: number;
      balanceDate?: string;
      caveat?: string;
    };

export function consensusOutlook(r: Research): {
  target: number;
  asOf: string;
  change: number | null;
  referenceStatus: "current" | "older" | "unavailable";
} | null {
  const e = r.evidence;
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const at = Date.parse(e?.updatedAt ?? "");
  const target = e?.consensus?.target;
  if (
    r.company.assetType !== "stock" ||
    r.company.currency !== r.quote.currency ||
    !Number.isFinite(now) ||
    !Number.isFinite(at) ||
    at > now + 86400000 ||
    now - at > 120 * 86400000 ||
    target == null ||
    !Number.isFinite(target) ||
    target <= 0
  )
    return null;
  const stamp = Date.parse(r.quote.asOf ?? "");
  const comparable =
    r.quote.price != null &&
    Number.isFinite(r.quote.price) &&
    r.quote.price > 0 &&
    Number.isFinite(stamp) &&
    stamp <= now + 60000 &&
    now - stamp <= 4 * 86400000;
  return {
    target,
    asOf: e!.updatedAt!,
    change: comparable ? (target / r.quote.price! - 1) * 100 : null,
    referenceStatus: !comparable
      ? "unavailable"
      : r.quote.stale
        ? "older"
        : "current",
  };
}

/** A forecast sensitivity, never a company-specific intrinsic valuation.
 * Low/average/high annual EPS are provider observations; 0.8/1/1.2 times the
 * reported forward P/E are explicitly disclosed stress assumptions. */
export function researchOutlook(r: Research): Outlook {
  const unavailable = (reason: string): Outlook => ({
    available: false,
    reason,
  });
  if (r.company.assetType !== "stock")
    return unavailable(
      "Corporate earnings scenarios do not apply to this asset.",
    );
  const e = r.evidence;
  const now = Date.parse(r.retrievedAt);
  if (!e || !Number.isFinite(now))
    return unavailable("A dated annual earnings forecast is needed.");
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: e.profile?.sector || r.company.sector,
    industry: e.profile?.industry,
  });
  if (
    !["operating-company", "infrastructure", "financial"].includes(
      coverage.family,
    )
  )
    return unavailable(
      "This business needs a sector-specific valuation framework.",
    );
  const outstanding = e.ownership?.outstanding;
  const marketCap = e.highlights?.MarketCapitalization;
  const aggregateListingBasis =
    e.reportingCurrency === r.quote.currency &&
    outstanding != null &&
    outstanding > 0 &&
    marketCap != null &&
    marketCap > 0 &&
    r.quote.price != null &&
    r.quote.price > 0 &&
    Math.abs(marketCap / (outstanding * r.quote.price) - 1) <= 0.1;
  if (r.company.foreignListing && !aggregateListingBasis)
    return unavailable(
      "The listing needs matching reporting currency and reconciled market-cap/share/price evidence before constructing per-share scenarios.",
    );
  const updated = Date.parse(e.updatedAt ?? "");
  if (
    !Number.isFinite(updated) ||
    updated > now + 86400000 ||
    now - updated > 120 * 86400000
  )
    return unavailable(
      "The earnings forecast needs a current observation date.",
    );
  const price = r.quote.price;
  if (price == null || !Number.isFinite(price) || price <= 0)
    return unavailable(
      "A current price is needed to compare forecast outcomes.",
    );
  if (r.quote.stale) {
    const observed = Date.parse(r.quote.asOf ?? "");
    const comparisonTime = Date.parse(r.priceObservedAt ?? r.retrievedAt);
    if (
      !Number.isFinite(observed) ||
      observed > comparisonTime + 60000 ||
      comparisonTime - observed > 4 * 86400000
    )
      return unavailable(
        "A dated recent reference price is needed for forecast comparisons.",
      );
  }
  const validFiscal = (
    x: NonNullable<Research["evidence"]>["estimates"][number],
  ) => {
    const label = /^FY(\d{4})$/i.exec(x.period);
    return (
      !label || Math.abs(Number(label[1]) - Number(x.date.slice(0, 4))) <= 1
    );
  };
  const usableEps = (
    x: NonNullable<Research["evidence"]>["estimates"][number],
  ) => {
    const days = (Date.parse(x.date) - now) / 86400000;
    return (
      /annual/i.test(x.frequency) &&
      days >= 270 &&
      days <= 1461 &&
      x.currency === r.quote.currency &&
      [x.epsLow, x.eps, x.epsHigh].every(
        (v) => v != null && Number.isFinite(v) && v > 0,
      ) &&
      x.epsLow! <= x.eps! &&
      x.eps! <= x.epsHigh!
    );
  };
  const hasEarnings =
    (e.estimates ?? []).some(usableEps) && (e.multiples?.ForwardPE ?? 0) > 0;
  if (
    coverage.family === "financial" &&
    (!hasEarnings || r.company.foreignListing)
  )
    return unavailable(
      "A bank earnings sensitivity needs a reconciled positive annual EPS range; operating cash flow and EV/revenue are not substitutes.",
    );
  if (
    coverage.family === "infrastructure" ||
    r.company.foreignListing ||
    !hasEarnings
  ) {
    if (r.quote.stale)
      return unavailable(
        "A current quote is needed for a price-anchored revenue sensitivity; analyst targets remain separate.",
      );
    const shares = e.ownership?.outstanding;
    let multiple = e.multiples?.EnterpriseValueRevenue;
    const balances = r.facts
      .filter(
        (f) =>
          f.metric === "cash" &&
          f.currency === r.quote.currency &&
          f.end <= r.retrievedAt.slice(0, 10) &&
          f.filed <= r.retrievedAt.slice(0, 10) &&
          now - Date.parse(f.end) <= 400 * 86400000,
      )
      .sort((a, b) => b.end.localeCompare(a.end));
    const cash = balances.find((candidate) =>
      r.facts.some(
        (f) =>
          f.metric === "debt" &&
          f.end === candidate.end &&
          f.accession === candidate.accession &&
          f.currency === candidate.currency &&
          f.filed <= r.retrievedAt.slice(0, 10) &&
          Number.isFinite(f.value) &&
          f.value >= 0 &&
          Number.isFinite(candidate.value) &&
          candidate.value >= 0,
      ),
    );
    const debt =
      cash &&
      r.facts.find(
        (f) =>
          f.metric === "debt" &&
          f.end === cash.end &&
          f.accession === cash.accession &&
          f.currency === cash.currency &&
          f.filed <= r.retrievedAt.slice(0, 10),
      );
    const estimate = (e.estimates ?? [])
      .filter((x) => {
        const days = (Date.parse(x.date) - now) / 86400000;
        return (
          /annual/i.test(x.frequency) &&
          days >= 90 &&
          days <= 1461 &&
          x.currency === r.quote.currency &&
          validFiscal(x) &&
          [x.revenueLow, x.revenue, x.revenueHigh].every(
            (v) => v != null && Number.isFinite(v) && v > 0,
          ) &&
          x.revenueLow! <= x.revenue! &&
          x.revenue! <= x.revenueHigh!
        );
      })
      .sort(
        (a, b) =>
          Math.abs(Date.parse(a.date) - now - 3 * 365.25 * 86400000) -
          Math.abs(Date.parse(b.date) - now - 3 * 365.25 * 86400000),
      )[0];
    if (
      !shares ||
      !Number.isFinite(shares) ||
      shares <= 0 ||
      !multiple ||
      !Number.isFinite(multiple) ||
      multiple <= 0 ||
      !cash ||
      !debt ||
      ![cash.value, debt.value].every((v) => Number.isFinite(v) && v >= 0)
    )
      return unavailable(
        "A complete positive EPS range is unavailable. Revenue scenarios need: " +
          [
            !shares || !Number.isFinite(shares) || shares <= 0
              ? "positive reported outstanding shares"
              : null,
            !multiple || !Number.isFinite(multiple) || multiple <= 0
              ? "a positive EV/revenue multiple"
              : null,
            !cash ||
            !debt ||
            ![cash.value, debt.value].every((v) => Number.isFinite(v) && v >= 0)
              ? "matching dated cash/debt evidence"
              : null,
          ]
            .filter(Boolean)
            .join("; ") +
          ".",
      );
    if (
      !estimate ||
      ![estimate.revenueLow, estimate.revenue, estimate.revenueHigh].every(
        (v) => v != null && Number.isFinite(v) && v > 0,
      ) ||
      estimate.revenueLow! > estimate.revenue! ||
      estimate.revenue! > estimate.revenueHigh!
    )
      return unavailable(
        "A complete ordered annual revenue forecast range in the quote currency is needed.",
      );
    const fiscal = /^FY(\d{4})$/i.exec(estimate.period);
    if (
      fiscal &&
      Math.abs(Number(fiscal[1]) - Number(estimate.date.slice(0, 4))) > 1
    )
      return unavailable(
        "The supplied fiscal period and forecast date conflict.",
      );
    const netDebt = debt.value - cash.value;
    // All listings need a share/quote bridge, not just foreign issuers. Mixing
    // millions of shares with whole shares can otherwise create thousand-fold targets.
    const reportedEV = e.multiples?.EnterpriseValue;
    const ttmRevenue = e.highlights?.RevenueTTM;
    const listingEquity = shares * price;
    const comparableEV = listingEquity + netDebt;
    const listingValid =
      e.reportingCurrency === r.quote.currency &&
      marketCap != null &&
      Number.isFinite(marketCap) &&
      marketCap > 0 &&
      Math.abs(marketCap / listingEquity - 1) <= 0.1 &&
      Number.isFinite(comparableEV) &&
      comparableEV > 0 &&
      ttmRevenue != null &&
      Number.isFinite(ttmRevenue) &&
      ttmRevenue > 0;
    if (!listingValid)
      return unavailable(
        "The share count, price, market capitalisation and revenue inputs do not reconcile on one currency basis. Revenue price sensitivities are withheld.",
      );
    const reportedMultipleValid =
      reportedEV != null &&
      Number.isFinite(reportedEV) &&
      reportedEV > 0 &&
      Math.abs(reportedEV / comparableEV - 1) <= 0.2 &&
      Math.abs(multiple! / (reportedEV / ttmRevenue!) - 1) <= 0.1;
    let calculatedMultiple = false;
    if (!reportedMultipleValid) {
      // Independently corroborate the revenue unit/period before rebuilding EV.
      // A stale or inconsistent vendor EV is not itself a reason to invent a
      // replacement denominator. Use the latest complete reported year or TTM.
      const annualRevenue = r.facts
        .filter(
          (f) =>
            f.metric === "revenue" &&
            f.scope === "annual" &&
            f.currency === r.quote.currency &&
            f.start &&
            f.end <= r.retrievedAt.slice(0, 10) &&
            f.filed <= r.retrievedAt.slice(0, 10) &&
            now - Date.parse(f.end) <= 400 * 86400000 &&
            Date.parse(f.end) - Date.parse(f.start) >= 330 * 86400000 &&
            Date.parse(f.end) - Date.parse(f.start) <= 400 * 86400000 &&
            Number.isFinite(f.value) &&
            f.value > 0,
        )
        .map((f) => ({ end: f.end, revenue: f.value }));
      const revenuePeriods = [
        ...annualRevenue,
        ...ttmPeriods(r.facts, r.retrievedAt).filter(
          (p) => p.currency === r.quote.currency,
        ),
      ]
        .filter(
          (p) =>
            p.revenue != null &&
            p.revenue > 0 &&
            now - Date.parse(p.end) <= 400 * 86400000,
        )
        .sort((a, b) => b.end.localeCompare(a.end));
      const latestRevenue = revenuePeriods[0];
      if (
        !latestRevenue ||
        Math.abs(ttmRevenue! / latestRevenue.revenue! - 1) > 0.1
      )
        return unavailable(
          "Reported EV inputs conflict and the revenue denominator cannot be corroborated against the latest complete financial period.",
        );
      multiple = comparableEV / ttmRevenue!;
      calculatedMultiple = true;
    }
    const years = (Date.parse(estimate.date) - now) / (365.25 * 86400000);
    const cases = (
      [
        ["Bear", estimate.revenueLow!, 0.8, 0.2],
        ["Base", estimate.revenue!, 1, 0.1],
        ["Bull", estimate.revenueHigh!, 1.2, 0],
      ] as const
    ).map(([name, revenue, stress, dilution]) => {
      const exitMultiple = multiple * stress;
      const target = Math.max(
        0,
        (revenue * exitMultiple - netDebt) / (shares * (1 + dilution)),
      );
      return {
        name,
        eps: null,
        revenue,
        multiple: exitMultiple,
        dilution,
        target,
        change: (target / price - 1) * 100,
        annual: (Math.pow(target / price, 1 / years) - 1) * 100,
      };
    });
    if (
      !cases.every((c) => [c.target, c.change, c.annual].every(Number.isFinite))
    )
      return unavailable("Revenue scenarios did not produce finite outcomes.");
    return {
      available: true,
      basis: "revenue",
      cases,
      years,
      period: fiscal ? estimate.period.toUpperCase() : "Annual forecast",
      end: estimate.date,
      asOf: e.updatedAt!,
      currency: r.quote.currency,
      analysts: estimate.analysts,
      forwardPE: 0,
      shares,
      netDebt,
      balanceDate: cash.end,
      ...(calculatedMultiple
        ? {
            caveat:
              "Calculated EV/revenue multiple: current quote × reported shares, plus dated net debt, divided by corroborated trailing revenue. Conflicting reported EV fields are excluded. This price-anchored sensitivity is not intrinsic fair value; future funding and capex are not forecast.",
          }
        : {}),
    };
  }
  const forwardPE = e.multiples?.ForwardPE;
  if (forwardPE == null || !Number.isFinite(forwardPE) || forwardPE <= 0)
    return unavailable(
      "A positive reported forward earnings multiple is needed.",
    );
  const annual = (e.estimates ?? [])
    .filter(usableEps)
    .filter(validFiscal)
    .filter((x) => {
      const days = (Date.parse(x.date) - now) / 86400000;
      return (
        x.frequency.toLowerCase().includes("annual") &&
        days >= 270 &&
        days <= 1461 &&
        x.currency === r.quote.currency
      );
    })
    .sort(
      (a, b) =>
        Math.abs(Date.parse(a.date) - now - 3 * 365.25 * 86400000) -
        Math.abs(Date.parse(b.date) - now - 3 * 365.25 * 86400000),
    );
  const estimate = annual[0];
  if (
    !estimate &&
    (e.estimates ?? []).some((x) => usableEps(x) && !validFiscal(x))
  )
    return unavailable(
      "The supplied fiscal period and forecast date conflict.",
    );
  if (!estimate)
    return unavailable(
      "A comparable annual EPS forecast with a complete positive range in the quote currency is needed.",
    );
  const fiscalLabel = /^FY(\d{4})$/i.exec(estimate.period);
  if (
    fiscalLabel &&
    Math.abs(Number(fiscalLabel[1]) - Number(estimate.date.slice(0, 4))) > 1
  )
    return unavailable(
      "The supplied fiscal period and forecast date conflict.",
    );
  const { epsLow: low, eps: base, epsHigh: high } = estimate;
  if (
    ![low, base, high].every((v) => v != null && Number.isFinite(v) && v > 0) ||
    low! > base! ||
    base! > high!
  )
    return unavailable(
      "A complete, ordered, positive low/base/high EPS range is needed.",
    );
  const years = (Date.parse(estimate.date) - now) / (365.25 * 86400000);
  const cases: OutlookCase[] = (
    [
      ["Bear", low!, 0.8],
      ["Base", base!, 1],
      ["Bull", high!, 1.2],
    ] as const
  ).map(([name, eps, stress]) => {
    const multiple = forwardPE * stress,
      target = eps * multiple;
    return {
      name,
      eps,
      multiple,
      target,
      change: (target / price - 1) * 100,
      annual: (Math.pow(target / price, 1 / years) - 1) * 100,
    };
  });
  if (
    !cases.every((x) => [x.target, x.change, x.annual].every(Number.isFinite))
  )
    return unavailable(
      "The supplied estimates do not produce finite outcomes.",
    );
  return {
    available: true,
    basis: "earnings",
    ...(coverage.family === "financial"
      ? {
          caveat:
            "Earnings sensitivity only. Capital adequacy, credit losses and tangible book value require a separate bank assessment.",
        }
      : {}),
    cases,
    years,
    period: fiscalLabel ? estimate.period.toUpperCase() : "Annual forecast",
    end: estimate.date,
    asOf: e.updatedAt!,
    currency: r.quote.currency,
    analysts: estimate.analysts,
    forwardPE,
  };
}
