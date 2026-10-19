import type { Candle } from "./types";
import { accumulation } from "./engine.ts";
import { candidatePolicy, settledPolicyBars } from "./accumulation-policy.ts";
import { monthEndSession } from "./calendar.ts";
type Execution = {
  month: string;
  executionDate: string;
  signalDate: string;
  open: number;
  close: number;
  original: number;
  candidate: number;
};
function simulate(rows: Execution[], costBps: number) {
  const policy = () => ({
    cash: 0,
    units: 0,
    contributed: 0,
    value: 0,
    costs: 0,
    drawdown: 0,
    nav: 1,
    peak: 1,
  });
  const fixed = policy(),
    original = policy(),
    candidate = policy(),
    history: {
      month: string;
      executionDate: string;
      signalDate: string;
      fixed: number;
      original: number;
      candidate: number;
      cash: number;
    }[] = [];
  for (const row of rows) {
    for (const [state, multiple] of [
      [fixed, 1],
      [original, row.original],
      [candidate, row.candidate],
    ] as const) {
      const before = state.value,
        openingValue = state.cash + state.units * row.open;
      if (before > 0) state.nav *= openingValue / before;
      state.cash += 100;
      state.contributed += 100;
      const spend = Math.min(state.cash, 100 * multiple),
        fee = (spend * costBps) / 10000;
      state.units += (spend - fee) / row.open;
      state.cash -= spend;
      state.costs += fee;
      state.value = state.cash + state.units * row.close;
      state.nav *= state.value / (openingValue + 100);
      state.peak = Math.max(state.peak, state.nav);
      state.drawdown = Math.min(
        state.drawdown,
        (state.nav / state.peak - 1) * 100,
      );
    }
    history.push({
      month: row.month,
      executionDate: row.executionDate,
      signalDate: row.signalDate,
      fixed: fixed.value,
      original: original.value,
      candidate: candidate.value,
      cash: candidate.cash,
    });
  }
  return { fixed, original, candidate, history };
}
export function evaluatePolicies(
  bars: Candle[],
  asOf: string,
  costBps = 10,
  market: "us-equity" | "crypto" = "us-equity",
) {
  if (!Number.isFinite(costBps) || costBps < 0 || costBps > 200)
    throw Error("Use zero to 200 basis points for fees and slippage.");
  const original = new Map(
      accumulation(bars, asOf, false, market).history.map((s) => [s.month, s]),
    ),
    candidate = new Map(
      candidatePolicy(bars, asOf, market).history.map((s) => [s.month, s]),
    ),
    months = new Map<string, Candle[]>();
  for (const b of settledPolicyBars(bars, asOf)) {
    const m = b.time.slice(0, 7);
    months.set(m, [...(months.get(m) ?? []), b]);
  }
  const eligible: Execution[] = [];
  for (const [month, rows] of months) {
    if (
      month >= asOf.slice(0, 7) ||
      rows.at(-1)!.time !== monthEndSession(month, market)
    )
      continue;
    const prev = new Date(
        Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 0),
      )
        .toISOString()
        .slice(0, 7),
      a = original.get(prev),
      b = candidate.get(prev);
    if (!a || !b) continue;
    eligible.push({
      month,
      executionDate: rows[0].time,
      signalDate: b.date,
      open: rows[0].open,
      close: rows.at(-1)!.close,
      original: a.multiplier,
      candidate: b.multiplier,
    });
  }
  if (eligible.length < 18)
    return {
      available: false as const,
      reason:
        "At least 18 common execution months after the 36-month warm-up are required.",
      eligibleMonths: eligible.length,
    };
  const cut = Math.floor(eligible.length * 0.7),
    development = eligible.slice(0, cut),
    holdout = eligible.slice(cut);
  return {
    available: true as const,
    version: "equal-budget-evaluation-v2",
    months: eligible.length,
    costBps,
    ...simulate(eligible, costBps),
    development: {
      start: development[0].month,
      end: development.at(-1)!.month,
      months: development.length,
    },
    holdout: {
      start: holdout[0].month,
      end: holdout.at(-1)!.month,
      months: holdout.length,
      ...simulate(holdout, costBps),
    },
    limitations: [
      "Fixed original and candidate rules; neither was tuned by this evaluator. The final chronological 30% is reported separately with accounts restarted at zero.",
      "100 units deposited per eligible month per policy; unspent cash carries forward, earns no interest and limits increased contributions. No borrowing or automatic selling.",
      "Prior completed-month signal, next month first observed open, then completed month-end valuation. Drawdown is measured at month ends after adjusting for deposits.",
      "Historical price-only simulation. Dividends, taxes, corporate fundamentals and delisted-universe coverage are not modeled. Splits/history adjustments may be revised.",
      "A per-symbol chronological comparison is not market-wide validation, a probability of success or a guarantee of future performance.",
    ],
  };
}
