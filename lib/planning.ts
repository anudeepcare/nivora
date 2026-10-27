import type { Candle } from "./types";
import { monthEndSession } from "./calendar.ts";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "./accumulation-policy-v5.ts";
import { symbolInput } from "./format.ts";
export function compareDca(
  bars: Candle[],
  asOf: string,
  costBps = 10,
  market: "us-equity" | "crypto" = "us-equity",
) {
  if (!Number.isFinite(costBps) || costBps < 0 || costBps > 200)
    throw Error("Costs must be between zero and two hundred basis points.");
  const signals = researchAccumulation(bars, asOf, market),
    lookup = new Map(signals.history.map((s) => [s.month, s])),
    months = new Map<string, Candle[]>();
  for (const b of adaptiveSettledBars(bars, asOf, market)) {
    const m = b.time.slice(0, 7);
    months.set(m, [...(months.get(m) || []), b]);
  }
  const policy = () => ({
      cash: 0,
      units: 0,
      contributed: 0,
      value: 0,
      costs: 0,
      drawdown: 0,
      turnover: 0,
      nav: 1,
      peak: 1,
    }),
    fixed = policy(),
    adaptive = policy(),
    history: {
      month: string;
      fixed: number;
      adaptive: number;
      multiplier: number;
      cash: number;
    }[] = [];
  for (const [month, rows] of months) {
    if (rows.at(-1)?.time !== monthEndSession(month, market)) continue;
    const prev = new Date(
        Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 0),
      )
        .toISOString()
        .slice(0, 7),
      signal = lookup.get(prev);
    if (!signal) continue;
    const entry = rows[0].open,
      close = rows.at(-1)!.close;
    if (!Number.isFinite(entry) || entry <= 0) continue;
    for (const [state, multiplier] of [
      [fixed, 1],
      [adaptive, signal.multiplier],
    ] as const) {
      const before = state.value;
      const openingValue = state.cash + state.units * entry;
      if (before > 0) state.nav *= openingValue / before;
      state.cash += 100;
      state.contributed += 100;
      const spend = Math.min(state.cash, 100 * multiplier),
        fee = (spend * costBps) / 10000;
      state.units += (spend - fee) / entry;
      state.cash -= spend;
      state.costs += fee;
      state.turnover += spend;
      state.value = state.cash + state.units * close;
      state.nav *= state.value / (openingValue + 100);
      state.peak = Math.max(state.peak, state.nav);
      state.drawdown = Math.min(
        state.drawdown,
        (state.nav / state.peak - 1) * 100,
      );
    }
    history.push({
      month,
      fixed: fixed.value,
      adaptive: adaptive.value,
      multiplier: signal.multiplier,
      cash: adaptive.cash,
    });
  }
  return {
    policy: signals.version,
    months: history.length,
    costBps,
    fixed,
    adaptive,
    history,
    limitations: [
      "Historical simulation; not live results.",
      "Equal contributions of 100 units at each eligible month start; unspent cash earns no interest.",
      "Orders modeled at the next month’s first available open. Fees and slippage combined in the stated basis points.",
      "Split-adjusted history can be revised; delisted securities and contemporaneous fundamentals are not included.",
      "No parameter tuning or calibrated success probability is claimed.",
    ],
  };
}
export function parseHoldingsCsv(
  text: string,
): { symbol: string; quantity: number; cost: number; currency: string }[] {
  if (text.length > 100000)
    throw Error("The file is too large. Import at most 200 positions.");
  const lines: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i] ?? "\n";
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (c === "\n") {
        if (row.some(Boolean)) lines.push(row);
        row = [];
      }
    } else if (c !== "\r") cell += c;
  }
  if (quoted) throw Error("The CSV contains an unclosed quotation mark.");
  const headers = lines.shift()?.map((h) => h.toLowerCase()) || [],
    indexes = ["symbol", "quantity", "cost", "currency"].map((k) =>
      headers.indexOf(k),
    );
  if (indexes.some((i) => i < 0))
    throw Error("CSV needs symbol,quantity,cost,currency columns.");
  if (!lines.length || lines.length > 200)
    throw Error("Import one to two hundred positions.");
  return lines.map((r, i) => {
    const symbol = symbolInput(r[indexes[0]]),
      quantity = Number(r[indexes[1]]),
      cost = Number(r[indexes[2]]),
      currency = r[indexes[3]];
    if (
      !r[indexes[1]] ||
      !r[indexes[2]] ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      currency !== "USD"
    )
      throw Error(
        `Row ${i + 2}: positive quantity, non-negative cost and explicit USD currency are required.`,
      );
    return { symbol, quantity, cost, currency };
  });
}
export function tradePreview(
  total: number,
  cash: number,
  existing: number,
  purchase: number,
  maxPct: number,
) {
  const reasons: string[] = [];
  if (
    ![total, cash, existing, purchase, maxPct].every(Number.isFinite) ||
    total <= 0 ||
    cash < 0 ||
    existing < 0 ||
    purchase <= 0 ||
    maxPct <= 0 ||
    maxPct > 100
  )
    return {
      allowed: false,
      cashAfter: cash,
      weightAfter: null,
      reasons: ["Valid portfolio values and limits are required."],
    };
  const weightAfter = ((existing + purchase) / total) * 100;
  if (purchase > cash) reasons.push("The purchase exceeds recorded cash.");
  if (weightAfter > maxPct)
    reasons.push("The resulting position exceeds your concentration limit.");
  return {
    allowed: !reasons.length,
    cashAfter: cash - purchase,
    weightAfter,
    reasons,
  };
}
export function stressPortfolio(
  rows: { symbol: string; value: number }[],
  shock: number,
) {
  if (!Number.isFinite(shock) || shock < -100 || shock > 100)
    throw Error("Shock must be between -100 and 100 percent.");
  const before = rows
      .filter((r) => Number.isFinite(r.value) && r.value >= 0)
      .reduce((s, r) => s + r.value, 0),
    change = (before * shock) / 100;
  return { before, after: before + change, change };
}
