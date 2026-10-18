import { modelCoverage } from "./research-depth.ts";
import type { Research } from "./types";

export type OutlookCase = {
  name: "Bear" | "Base" | "Bull";
  eps: number;
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
    };

export function consensusOutlook(
  r: Research,
): { target: number; asOf: string } | null {
  const e = r.evidence;
  const now = Date.parse(r.retrievedAt);
  const at = Date.parse(e?.updatedAt ?? "");
  const target = e?.consensus?.target;
  if (
    r.company.assetType !== "stock" ||
    r.company.foreignListing ||
    r.quote.stale ||
    r.quote.price == null ||
    r.quote.price <= 0 ||
    !Number.isFinite(now) ||
    !Number.isFinite(at) ||
    at > now + 86400000 ||
    now - at > 120 * 86400000 ||
    target == null ||
    !Number.isFinite(target) ||
    target <= 0
  )
    return null;
  return { target, asOf: e!.updatedAt! };
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
  if (r.company.foreignListing)
    return unavailable(
      "The listing and forecast share/currency basis need reconciliation.",
    );
  const e = r.evidence;
  const now = Date.parse(r.retrievedAt);
  if (!e || !Number.isFinite(now))
    return unavailable("A dated annual earnings forecast is needed.");
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: e.profile?.sector || r.company.sector,
    industry: e.profile?.industry,
  });
  if (coverage.family !== "operating-company")
    return unavailable(
      "This business needs a sector-specific valuation framework.",
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
  if (r.quote.stale || price == null || !Number.isFinite(price) || price <= 0)
    return unavailable(
      "A current price is needed to compare forecast outcomes.",
    );
  const forwardPE = e.multiples?.ForwardPE;
  if (forwardPE == null || !Number.isFinite(forwardPE) || forwardPE <= 0)
    return unavailable(
      "A positive reported forward earnings multiple is needed.",
    );
  const annual = (e.estimates ?? [])
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
  if (!estimate)
    return unavailable(
      "A comparable annual EPS forecast in the quote currency is needed.",
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
