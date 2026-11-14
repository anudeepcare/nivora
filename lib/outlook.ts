import { usableAnalystTargets } from "./sentisense-targets.ts";
import { modelCoverage, ttmPeriods } from "./research-depth.ts";
import { selectPriceReference, settledPriceBars } from "./price-reference.ts";
import type { Research } from "./types";
import { listingReconciliation } from "./listing-reconciliation.ts";
import { compareFinancialFacts } from "./financial-period-selection.ts";

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
  | {
      available: false;
      reason: string;
      recovery?: { kind: "funded-assumptions"; title: string; detail: string };
    }
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
      multipleSource?:
        | "reported-compatible"
        | "user-assumption"
        | "price-implied";
      multipleReferencePeriod?: string;
      basis?: "earnings" | "revenue";
      shares?: number;
      netDebt?: number;
      balanceDate?: string;
      caveat?: string;
      calculatedMultiple?: boolean;
    };

export function consensusOutlook(r: Research): {
  target: number;
  low?: number;
  high?: number;
  rangeStatus: "complete" | "missing" | "invalid";
  source: string | null;
  sourceField: string | null;
  analysts: number | null;
  timestampBasis: "dataset-refresh";
  asOf: string;
  change: number | null;
  referenceStatus: "current" | "older" | "unavailable";
  referencePrice: number | null;
  referenceAsOf: string | null;
  referenceBasis: "quote" | "settled-close";
} | null {
  const e = r.evidence;
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const dedicated = usableAnalystTargets(
    r.analystTargets,
    r.company.symbol,
    r.quote.currency,
    now,
  )
    ? r.analystTargets
    : null;
  const updatedAt = dedicated?.updatedAt ?? e?.updatedAt;
  const at = Date.parse(updatedAt ?? "");
  const target = dedicated?.target ?? e?.consensus?.target;
  if (
    r.company.assetType !== "stock" ||
    r.company.currency !== r.quote.currency ||
    (!dedicated &&
      e?.consensus?.currency != null &&
      e.consensus.currency !== r.quote.currency) ||
    !Number.isFinite(now) ||
    !Number.isFinite(at) ||
    at > now + 86400000 ||
    now - at > 120 * 86400000 ||
    target == null ||
    !Number.isFinite(target) ||
    target <= 0
  )
    return null;
  // Analyst upside is compared with the finished daily session. A newer
  // after-hours quote must not move this reference away from that close.
  const last = r.history?.length ? settledPriceBars(r, now).at(-1) : null;
  const selected = last
    ? { price: last.close, asOf: last.time, basis: "settled-close" as const }
    : null;
  const price = selected?.price ?? r.quote.price;
  const stamp = Date.parse(selected?.asOf ?? r.quote.asOf ?? "");
  const comparable =
    price != null &&
    Number.isFinite(price) &&
    price > 0 &&
    Number.isFinite(stamp) &&
    stamp <= now + 60000 &&
    now - stamp <= 4 * 86400000;
  const low = dedicated?.low ?? e?.consensus?.low,
    high = dedicated?.high ?? e?.consensus?.high;
  const rangeValid =
    low != null &&
    high != null &&
    Number.isFinite(low) &&
    Number.isFinite(high) &&
    low > 0 &&
    low <= target &&
    target <= high;
  return {
    target,
    ...(rangeValid ? { low: low!, high: high! } : {}),
    rangeStatus: rangeValid
      ? "complete"
      : low == null || high == null
        ? "missing"
        : "invalid",
    source: dedicated?.source ?? (e?.source || null),
    sourceField:
      dedicated?.sourceField ?? (e?.consensus?.targetSourceField || null),
    analysts: dedicated?.analysts ?? null,
    timestampBasis: "dataset-refresh",
    asOf: updatedAt!,
    change: comparable ? (target / price! - 1) * 100 : null,
    referencePrice: comparable ? price! : null,
    referenceAsOf: comparable ? (selected?.asOf ?? r.quote.asOf) : null,
    referenceBasis: selected?.basis ?? "quote",
    referenceStatus: !comparable
      ? "unavailable"
      : !selected && r.quote.stale
        ? "older"
        : "current",
  };
}

/** A forecast sensitivity, never a company-specific intrinsic valuation.
 * Low/average/high annual EPS are provider observations; 0.8/1/1.2 times the
 * compatible reported forward P/E (or an explicit user multiple) are stress assumptions. */
export function researchOutlook(
  r: Research,
  assumptions?: {
    earningsMultiple?: number;
    fiscalEnd?: string;
    priceAnchored?: boolean;
  },
): Outlook {
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  const recovery =
    coverage.family === "frontier"
      ? {
          kind: "funded-assumptions" as const,
          title: "Model deployment and financing",
          detail:
            "Connect delivered milestones and commercial revenue to capex, cash runway, financing terms and dilution. Enter sourced assumptions for each case; these are personal sensitivities, not validated forecasts.",
        }
      : coverage.family === "infrastructure"
        ? {
            kind: "funded-assumptions" as const,
            title: "Reconcile capacity, capex and funding",
            detail:
              "Separate contracted capacity from operating revenue. Reconcile reported cash, debt, listed shares and currency, then test capex, utilization economics and financing assumptions. Missing values remain blank.",
          }
        : undefined;
  const unavailable = (reason: string): Outlook => ({
    available: false,
    reason,
    ...(recovery ? { recovery } : {}),
  });
  if (r.company.assetType !== "stock")
    return unavailable(
      "Corporate earnings scenarios do not apply to this asset.",
    );
  const e = r.evidence;
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  if (!e || !Number.isFinite(now))
    return unavailable("A dated annual earnings forecast is needed.");

  if (
    !["operating-company", "infrastructure", "financial"].includes(
      coverage.family,
    )
  )
    return unavailable(
      coverage.family === "frontier"
        ? "Deployment and commercial milestones, cash runway and future financing must be modeled explicitly. Current losses or an earnings multiple cannot establish automatic targets for this business."
        : "This business needs a sector-specific valuation framework.",
    );
  const listing = listingReconciliation(r);
  const aggregateListingBasis = listing.status === "available";
  if (r.company.foreignListing && !aggregateListingBasis)
    return unavailable(
      "The listing needs matching reporting currency and reconciled market-cap/share/price evidence before constructing per-share scenarios. " +
        listing.detail,
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
  {
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
      days >= 90 &&
      days <= 1461 &&
      x.currency === r.quote.currency &&
      [x.epsLow, x.eps, x.epsHigh].every(
        (v) => v != null && Number.isFinite(v) && v > 0,
      ) &&
      x.epsLow! <= x.eps! &&
      x.eps! <= x.epsHigh!
    );
  };
  const selectedEstimates = (e.estimates ?? []).filter(
    (x) => !assumptions?.fiscalEnd || x.date === assumptions.fiscalEnd,
  );
  const usableRevenue = (
    x: NonNullable<Research["evidence"]>["estimates"][number],
  ) => {
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
  };
  // Eligibility must describe the requested fiscal period, not an unrelated
  // profitable year that prevents the selected revenue sensitivity from running.
  const hasEarnings = selectedEstimates.some(
    (x) => usableEps(x) && validFiscal(x),
  );
  if (
    !hasEarnings &&
    selectedEstimates.some((x) => usableEps(x) && !validFiscal(x)) &&
    !selectedEstimates.some(usableRevenue)
  )
    return unavailable(
      "The supplied fiscal period and forecast date conflict.",
    );
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
    // A valid balance pair in another currency is present evidence, not
    // missing cash/debt. Explain the conversion gap without relabelling values.
    const pairedCurrencies = [
      ...new Set(
        r.facts
          .filter(
            (candidate) =>
              candidate.metric === "cash" &&
              candidate.scope === "instant" &&
              candidate.currency != null &&
              candidate.unit === candidate.currency &&
              /^[A-Z]{3}$/.test(candidate.currency) &&
              Number.isFinite(candidate.value) &&
              candidate.value >= 0 &&
              Number.isFinite(Date.parse(candidate.end)) &&
              Number.isFinite(Date.parse(candidate.filed)) &&
              candidate.end <= r.retrievedAt.slice(0, 10) &&
              candidate.filed <= r.retrievedAt.slice(0, 10) &&
              now - Date.parse(candidate.end) <= 400 * 86400000 &&
              r.facts.some(
                (f) =>
                  f.metric === "debt" &&
                  f.scope === "instant" &&
                  f.currency === candidate.currency &&
                  f.unit === candidate.unit &&
                  f.basis === candidate.basis &&
                  f.end === candidate.end &&
                  f.accession === candidate.accession &&
                  Number.isFinite(Date.parse(f.filed)) &&
                  f.filed <= r.retrievedAt.slice(0, 10) &&
                  Number.isFinite(f.value) &&
                  f.value >= 0,
              ),
          )
          .map((f) => f.currency!),
      ),
    ];
    if (pairedCurrencies.length && !pairedCurrencies.includes(r.quote.currency))
      return unavailable(
        `Matched dated cash/debt evidence is available in ${pairedCurrencies.join(" / ")}, but the listing quote is ${r.quote.currency}. A dated currency conversion and compatible revenue/share evidence are required for per-share scenarios. No currency conversion is inferred.`,
      );
    if (listing.status !== "available")
      return unavailable("Revenue sensitivity unavailable: " + listing.detail);
    const shares = listing.shares;
    let multiple = e.multiples?.EnterpriseValueRevenue;
    const balances = r.facts
      .filter(
        (f) =>
          f.metric === "cash" &&
          f.scope === "instant" &&
          f.unit === r.quote.currency &&
          f.currency === r.quote.currency &&
          f.end <= r.retrievedAt.slice(0, 10) &&
          f.filed <= r.retrievedAt.slice(0, 10) &&
          now - Date.parse(f.end) <= 400 * 86400000,
      )
      .sort(
        (a, b) => b.end.localeCompare(a.end) || compareFinancialFacts(a, b),
      );
    const cash = balances.find((candidate) =>
      r.facts.some(
        (f) =>
          f.metric === "debt" &&
          f.scope === "instant" &&
          f.unit === candidate.unit &&
          f.basis === candidate.basis &&
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
          f.scope === "instant" &&
          f.unit === cash.unit &&
          f.basis === cash.basis &&
          f.end === cash.end &&
          f.accession === cash.accession &&
          f.currency === cash.currency &&
          f.filed <= r.retrievedAt.slice(0, 10),
      );
    const estimate = selectedEstimates
      .filter(usableRevenue)
      .sort(
        (a, b) =>
          Math.abs(Date.parse(a.date) - now - 3 * 365.25 * 86400000) -
          Math.abs(Date.parse(b.date) - now - 3 * 365.25 * 86400000),
      )[0];
    if (
      !shares ||
      !Number.isFinite(shares) ||
      shares <= 0 ||
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
      aggregateListingBasis &&
      Number.isFinite(comparableEV) &&
      comparableEV > 0 &&
      ttmRevenue != null &&
      Number.isFinite(ttmRevenue) &&
      ttmRevenue > 0;
    if (!listingValid)
      return unavailable(
        "Revenue price sensitivities need dated, comparable market-cap/share/price observations and trailing revenue on one currency basis. " +
          listing.detail,
      );
    const reportedMultipleValid =
      multiple != null &&
      Number.isFinite(multiple) &&
      multiple > 0 &&
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
            f.unit === r.quote.currency &&
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
    if (multiple == null || !Number.isFinite(multiple) || multiple <= 0)
      return unavailable(
        "A finite positive corroborated EV/revenue multiple is needed.",
      );
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
      period: fiscal
        ? estimate.period.toUpperCase()
        : `FY${estimate.date.slice(0, 4)}`,
      end: estimate.date,
      asOf: e.updatedAt!,
      currency: r.quote.currency,
      analysts: estimate.analysts,
      forwardPE: 0,
      shares,
      netDebt,
      balanceDate: cash.end,
      calculatedMultiple,
      caveat: [
        listing.detail,
        calculatedMultiple
          ? "Calculated EV/revenue multiple: current quote × the dated share count, plus dated net debt, divided by corroborated trailing revenue. Conflicting reported EV fields are excluded."
          : "Reported EV/revenue is a conditional reference multiple, not an independently validated valuation.",
        "This sensitivity is not intrinsic fair value. The share count and balance sheet are dated observations; subsequent issuance, funding and capex are not forecast. Case dilution and multiple changes are stress assumptions, not company forecasts.",
      ].join(" "),
    };
  }
  const userMultiple = assumptions?.earningsMultiple;
  if (
    userMultiple !== undefined &&
    (!Number.isFinite(userMultiple) || userMultiple <= 0 || userMultiple > 500)
  )
    return unavailable("Enter a positive P/E assumption no greater than 500×.");
  const anchor =
    userMultiple === undefined && assumptions?.priceAnchored
      ? (e.estimates ?? [])
          .filter((x) => {
            const days = (Date.parse(x.date) - now) / 86400000;
            return (
              /annual/i.test(x.frequency) &&
              days >= 0 &&
              days <= 550 &&
              validFiscal(x) &&
              x.currency === r.quote.currency &&
              [x.epsLow, x.eps, x.epsHigh].every(
                (v) => v != null && Number.isFinite(v) && v > 0,
              ) &&
              x.epsLow! <= x.eps! &&
              x.eps! <= x.epsHigh!
            );
          })
          .sort((a, b) => a.date.localeCompare(b.date))[0]
      : undefined;
  const forwardPE =
    userMultiple ??
    (anchor
      ? price / anchor.eps!
      : assumptions?.priceAnchored
        ? undefined
        : e.multiples?.ForwardPE);
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
        days >= 90 &&
        days <= 1461 &&
        x.currency === r.quote.currency
      );
    })
    .sort(
      (a, b) =>
        Math.abs(Date.parse(a.date) - now - 3 * 365.25 * 86400000) -
        Math.abs(Date.parse(b.date) - now - 3 * 365.25 * 86400000),
    );
  const estimate = assumptions?.fiscalEnd
    ? annual.find((x) => x.date === assumptions.fiscalEnd)
    : annual[0];
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
  // ForwardPE has no supplied denominator date/accounting basis. A recent dataset
  // timestamp alone cannot validate it. Compare its implied EPS with the nearest
  // positive annual range before using it as a *conditional* reference multiple.
  const referenceEstimate = (e.estimates ?? [])
    .filter((x) => {
      const days = (Date.parse(x.date) - now) / 86400000;
      return (
        /annual/i.test(x.frequency) &&
        days >= 0 &&
        days <= 550 &&
        validFiscal(x) &&
        x.currency === r.quote.currency &&
        [x.epsLow, x.eps, x.epsHigh].every(
          (v) => v != null && Number.isFinite(v) && v > 0,
        ) &&
        x.epsLow! <= x.eps! &&
        x.eps! <= x.epsHigh!
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const impliedEps = price / forwardPE;
  if (
    userMultiple === undefined &&
    !assumptions?.priceAnchored &&
    (!referenceEstimate ||
      impliedEps < referenceEstimate.epsLow! * 0.9 ||
      impliedEps > referenceEstimate.epsHigh! * 1.1)
  )
    return unavailable(
      "The reported forward P/E cannot be reconciled with the nearest annual EPS range at the reference price. Its earnings period and accounting/split basis are not supplied. Set an explicit P/E assumption to explore conditional outcomes; this does not validate the provider multiple.",
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
    multipleSource: anchor
      ? "price-implied"
      : userMultiple === undefined
        ? "reported-compatible"
        : "user-assumption",
    multipleReferencePeriod: referenceEstimate
      ? `FY${referenceEstimate.date.slice(0, 4)}`
      : undefined,
    caveat:
      (anchor
        ? `Price-anchored sensitivity: reference price divided by the nearest annual EPS estimate (${anchor.date}) sets the central P/E. Bear/base/bull use 0.8×/1×/1.2× that multiple with supplied low/average/high EPS. This assumes today’s market pricing persists; it is not independent fair value or an analyst price target.`
        : userMultiple === undefined
          ? "Reported forward P/E is numerically compatible with the nearest annual EPS range (10% tolerance). This check does not verify its earnings period, accounting or split basis."
          : "The exit P/E is your explicit assumption, not a verified provider multiple or an analyst target.") +
      (coverage.family === "financial"
        ? " Capital adequacy, credit losses and tangible book value require a separate bank assessment."
        : ""),
    cases,
    years,
    period: fiscalLabel
      ? estimate.period.toUpperCase()
      : `FY${estimate.date.slice(0, 4)}`,
    end: estimate.date,
    asOf: e.updatedAt!,
    currency: r.quote.currency,
    analysts: estimate.analysts,
    forwardPE,
  };
}
