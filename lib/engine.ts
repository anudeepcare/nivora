import { evidenceMemo } from "./evidence-memo.ts";
import { monthEndSession } from "./calendar.ts";
import {
  flowFields,
  balanceFields,
  withFinancialRatios,
} from "./financial-formulas.ts";
import type {
  Candle,
  Fact,
  FinancialPeriod,
  Position,
  Quote,
  Signal,
} from "./types";
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const monthIndex = (s: string) =>
  Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1;
const validDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
function computeAccumulation(
  bars: Candle[],
  asOf: string,
  broken = false,
  market: "us-equity" | "crypto" = "us-equity",
): {
  confirmed: Signal | null;
  forming: Signal | null;
  history: Signal[];
  reason: string;
  version: string;
} {
  const empty = {
    confirmed: null,
    forming: null,
    history: [],
    reason: "24 consecutive completed months are required.",
    version: "monthly-v1",
  };
  if (!Number.isFinite(Date.parse(asOf))) return empty;
  const day = new Date(asOf).toISOString().slice(0, 10),
    current = day.slice(0, 7),
    group = new Map<string, Candle>();
  for (const b of [...bars].sort((a, b) => a.time.localeCompare(b.time))) {
    if (
      !validDate(b.time) ||
      b.time >= day ||
      ![b.open, b.high, b.low, b.close].every((n) => finite(n) && n > 0) ||
      b.high < Math.max(b.open, b.close, b.low) ||
      b.low > Math.min(b.open, b.close, b.high)
    )
      continue;
    group.set(b.time.slice(0, 7), b);
  }
  const rows = [...group.entries()],
    history: Signal[] = [];
  let forming: Signal | null = null;
  for (let i = 23; i < rows.length; i++) {
    const window = rows.slice(i - 23, i + 1),
      [month, bar] = rows[i];
    if (
      window.some(
        (r, j) =>
          j > 0 && monthIndex(r[0]) - monthIndex(window[j - 1][0]) !== 1,
      )
    )
      continue;
    // Require the expected final session, never merely a date near month end.
    if (
      window.some(
        ([m, b]) => m < current && b.time !== monthEndSession(m, market),
      )
    )
      continue;
    const average = window.reduce((s, [, b]) => s + b.close, 0) / 24,
      peak = Math.max(...window.map(([, b]) => b.close));
    const drawdown = (bar.close / peak - 1) * 100,
      deviation = (bar.close / average - 1) * 100;
    const multiplier = accumulationBand(drawdown, deviation);
    const reason =
      multiplier === 0
        ? "Price is stretched above its 24-month average."
        : multiplier === 1
          ? "Price has not reached a stronger accumulation band."
          : `${Math.abs(drawdown).toFixed(0)}% below the 24-month closing high, ${Math.abs(deviation).toFixed(0)}% below its average.`;
    const signal = {
      month,
      multiplier,
      close: bar.close,
      drawdown,
      deviation,
      reason,
    };
    if (month < current) history.push(signal);
    else if (month === current) forming = signal;
  }
  const latest = history.at(-1),
    fresh = latest && monthIndex(current) - monthIndex(latest.month) === 1;
  const confirmed = fresh
    ? broken
      ? {
          ...latest,
          multiplier: 0 as const,
          reason: "Accumulation paused: the business thesis needs review.",
        }
      : latest
    : null;
  return {
    confirmed,
    forming:
      broken && forming
        ? { ...forming, multiplier: 0, reason: "Thesis review takes priority." }
        : forming,
    history,
    reason: confirmed
      ? "Experimental price policy; not a return prediction."
      : empty.reason,
    version: "monthly-v1",
  };
}
export function financialPeriods(
  facts: Fact[],
  scope: "annual" | "quarterly",
  asOf: string,
): FinancialPeriod[] {
  if (!Number.isFinite(Date.parse(asOf))) return [];
  const day = asOf.slice(0, 10),
    groups = new Map<string, Fact[]>(),
    byEndAndBasis = new Map<string, Fact[]>();
  for (const f of facts) {
    if (
      finite(f.value) &&
      validDate(f.end) &&
      validDate(f.filed) &&
      f.end <= day &&
      f.filed <= day
    ) {
      const instantKey = `${f.end}|${f.basis}`;
      const bucket = byEndAndBasis.get(instantKey);
      if (bucket) bucket.push(f);
      else byEndAndBasis.set(instantKey, [f]);
    }
    if (
      f.scope !== scope ||
      !finite(f.value) ||
      !f.currency ||
      !f.start ||
      !validDate(f.end) ||
      !validDate(f.filed) ||
      f.end > day ||
      f.filed > day
    )
      continue;
    const key = [f.start, f.end, f.currency, f.basis].join("|");
    groups.set(key, [...(groups.get(key) || []), f]);
  }
  for (const bucket of byEndAndBasis.values())
    bucket.sort((a, b) => b.filed.localeCompare(a.filed));
  return [...groups.values()]
    .map((group) => {
      const ordered = [...group].sort((a, b) => b.filed.localeCompare(a.filed)),
        anchor = ordered[0];
      const get = (metric: string) => ordered.find((f) => f.metric === metric),
        value = (metric: string) => get(metric)?.value ?? null;
      const cfo = get("operatingCashFlow"),
        capex = cfo
          ? ordered.find(
              (f) =>
                f.metric === "capex" &&
                f.accession === cfo.accession &&
                f.filed === cfo.filed,
            )
          : null;
      const revenue = value("revenue"),
        op = value("operatingIncome");
      const compatible =
        byEndAndBasis.get(`${anchor.end}|${anchor.basis}`) ?? [];
      const balance = Object.fromEntries(
        balanceFields.map((k) => [
          k,
          compatible.find(
            (f) =>
              f.metric === k &&
              f.scope === "instant" &&
              f.currency === anchor.currency,
          )?.value ?? null,
        ]),
      );
      const weight = compatible.find(
        (f) =>
          f.metric === "weightedShares" &&
          f.start === anchor.start &&
          f.scope === scope &&
          f.unit === "shares",
      );
      const flows = Object.fromEntries(flowFields.map((k) => [k, value(k)]));
      // Derive gross profit only from matching currency, period and accession.
      const revenueFact = get("revenue"),
        costFact = get("costOfRevenue");
      if (
        flows.grossProfit == null &&
        revenueFact &&
        costFact &&
        revenueFact.accession === costFact.accession
      )
        flows.grossProfit = revenueFact.value - costFact.value;
      return withFinancialRatios({
        end: anchor.end,
        start: anchor.start!,
        currency: anchor.currency!,
        basis: anchor.basis,
        filed: anchor.filed,
        sourceUrl: anchor.sourceUrl,
        revenue,
        netIncome: value("netIncome"),
        operatingIncome: op,
        operatingCashFlow: cfo?.value ?? null,
        capex: capex?.value ?? null,
        fcf: cfo && capex ? cfo.value - Math.abs(capex.value) : null,
        margin:
          revenue != null && revenue > 0 && op != null
            ? (op / revenue) * 100
            : null,
        ...flows,
        ...balance,
        weightedShares: weight?.value ?? null,
        eps:
          ordered.find(
            (f) => f.metric === "eps" && f.unit === `${anchor.currency}/shares`,
          )?.value ?? null,
        sourceUrls: [
          ...new Set(
            [
              ...ordered,
              ...compatible.filter(
                (f) =>
                  (f.scope === "instant" && f.currency === anchor.currency) ||
                  f === weight,
              ),
            ].map((f) => f.sourceUrl),
          ),
        ],
      });
    })
    .sort((a, b) => a.end.localeCompare(b.end));
}
export function portfolioTotals(
  positions: Position[],
  quotes: Record<string, Quote>,
) {
  let knownValue = 0,
    cost = 0,
    unknownCost = false;
  const missing: string[] = [];
  for (const p of positions) {
    const price =
      p.assetType === "cash"
        ? p.currency === "USD" && p.symbol === "USD"
          ? 1
          : null
        : quotes[p.symbol]?.price;
    if (
      !finite(p.quantity) ||
      p.quantity <= 0 ||
      !finite(p.cost) ||
      p.cost < 0
    ) {
      missing.push(p.symbol);
      continue;
    }
    if (p.currency !== "USD") unknownCost = true;
    else cost += p.quantity * p.cost;
    if (
      !finite(price) ||
      price <= 0 ||
      (p.assetType !== "cash" &&
        quotes[p.symbol]?.currency !== "USD")
    ) {
      missing.push(p.symbol);
      continue;
    }
    knownValue += price * p.quantity;
  }
  return {
    knownValue,
    cost: unknownCost ? null : cost,
    pnl: missing.length || unknownCost ? null : knownValue - cost,
    missing: [...new Set(missing)],
  };
}
export function cashFlowValue(
  cash: number,
  shares: number,
  growth: number,
  discount: number,
  terminal: number,
  dilution = 0,
): number | null {
  if (
    ![cash, shares, growth, discount, terminal, dilution].every(finite) ||
    cash <= 0 ||
    shares <= 0 ||
    discount <= terminal ||
    discount <= 0 ||
    growth <= -100 ||
    terminal <= -100 ||
    dilution < 0 ||
    dilution > 100
  )
    return null;
  let result = 0,
    flow = cash,
    denominator = shares;
  for (let y = 1; y <= 5; y++) {
    flow *= 1 + growth / 100;
    denominator *= 1 + dilution / 100;
    result += flow / denominator / (1 + discount / 100) ** y;
  }
  const perShareGrowth = (1 + terminal / 100) / (1 + dilution / 100) - 1;
  result +=
    (flow * (1 + terminal / 100)) /
    (denominator * (1 + dilution / 100)) /
    (discount / 100 - perShareGrowth) /
    (1 + discount / 100) ** 5;
  return finite(result) && result > 0 ? Math.round(result * 1e8) / 1e8 : null;
}

export function accumulationBand(
  drawdown: number,
  deviation: number,
): Signal["multiplier"] {
  return deviation > 25
    ? 0
    : drawdown <= -50 && deviation <= -35
      ? 4
      : drawdown <= -30 && deviation <= -20
        ? 3
        : drawdown <= -15 && deviation <= -10
          ? 2
          : 1;
}

const accumulationMemo = evidenceMemo<ReturnType<typeof computeAccumulation>>();
export function accumulation(
  bars: Candle[],
  asOf: string,
  broken = false,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return accumulationMemo(
    bars,
    `${bars.length}:${asOf}:${broken}:${market}`,
    () => computeAccumulation(bars, asOf, broken, market),
  );
}
