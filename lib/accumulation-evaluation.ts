import type { Candle } from "./types";
import {
  adaptiveSettledBars,
  researchAccumulation,
} from "./accumulation-policy-v4.ts";
import { researchAccumulation as priorPolicy } from "./accumulation-policy-v3.ts";
import { monthEndSession } from "./calendar.ts";
type Row = {
  month: string;
  signalDate: string;
  executionDate: string;
  open: number;
  close: number;
  multiple: number;
};
function simulate(rows: Row[], costBps: number) {
  const state = () => ({
    cash: 0,
    units: 0,
    contributed: 0,
    value: 0,
    costs: 0,
    drawdown: 0,
    nav: 1,
    peak: 1,
  });
  const fixed = state(),
    adaptive = state(),
    history: {
      month: string;
      signalDate: string;
      executionDate: string;
      fixed: number;
      adaptive: number;
      cash: number;
    }[] = [];
  for (const row of rows) {
    for (const [s, multiple] of [
      [fixed, 1],
      [adaptive, row.multiple],
    ] as const) {
      const opening = s.cash + s.units * row.open;
      if (s.value > 0) s.nav *= opening / s.value;
      s.cash += 100;
      s.contributed += 100;
      const spend = Math.min(s.cash, 100 * multiple),
        fee = (spend * costBps) / 10000;
      s.units += (spend - fee) / row.open;
      s.cash -= spend;
      s.costs += fee;
      s.value = s.cash + s.units * row.close;
      s.nav *= s.value / (opening + 100);
      s.peak = Math.max(s.peak, s.nav);
      s.drawdown = Math.min(s.drawdown, (s.nav / s.peak - 1) * 100);
    }
    history.push({
      month: row.month,
      signalDate: row.signalDate,
      executionDate: row.executionDate,
      fixed: fixed.value,
      adaptive: adaptive.value,
      cash: adaptive.cash,
    });
  }
  return { fixed, adaptive, history };
}
export function evaluateAccumulation(
  bars: Candle[],
  asOf: string,
  costBps = 10,
  market: "us-equity" | "crypto" = "us-equity",
  policy: "monthly-v3" | "monthly-v4" = "monthly-v4",
) {
  if (!Number.isFinite(costBps) || costBps < 0 || costBps > 200)
    throw Error("Use zero to 200 basis points.");
  const signals = new Map(
    (policy === "monthly-v3" ? priorPolicy : researchAccumulation)(bars, asOf, market).history.map((s) => [s.month, s]),
  );
  const months = new Map<string, Candle[]>();
  for (const b of adaptiveSettledBars(bars, asOf, market)) {
    const m = b.time.slice(0, 7);
    months.set(m, [...(months.get(m) ?? []), b]);
  }
  const rows: Row[] = [];
  for (const [m, prices] of months) {
    if (prices.at(-1)!.time !== monthEndSession(m, market)) continue;
    const prev = new Date(
        Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 0),
      )
        .toISOString()
        .slice(0, 7),
      s = signals.get(prev);
    if (!s || prices[0].time <= s.date) continue;
    rows.push({
      month: m,
      signalDate: s.date,
      executionDate: prices[0].time,
      open: prices[0].open,
      close: prices.at(-1)!.close,
      multiple: s.multiplier,
    });
  }
  if (rows.length < 18)
    return {
      available: false as const,
      reason:
        "18 completed execution months after the 24-month prior-history warm-up are required.",
      eligibleMonths: rows.length,
    };
  const cut = Math.floor(rows.length * 0.7),
    later = rows.slice(cut);
  return {
    available: true as const,
    version: `${policy}-evaluation`,
    months: rows.length,
    costBps,
    ...simulate(rows, costBps),
    holdout: {
      start: later[0].month,
      end: later.at(-1)!.month,
      months: later.length,
      ...simulate(later, costBps),
    },
    limitations: [
      "100 model units deposited monthly in each account. Increased contributions spend only carried cash; no borrowing or selling.",
      "Prior confirmed signal, next month first observed open, completed month-end mark. Drawdown adjusts for external deposits and is measured monthly.",
      "Fixed rules. The later chronological 30% restarts both accounts at zero; this is not an independent validation dataset.",
      "Hypothetical price-only simulation. Dividends, interest, taxes and universe survivorship are excluded. History adjustments can be revised. No outperformance claim.",
    ],
  };
}
