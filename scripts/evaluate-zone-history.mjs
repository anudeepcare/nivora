import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { evaluateAccumulation } from "../lib/accumulation-evaluation.ts";
import { researchAccumulation } from "../lib/accumulation-policy-v5.ts";

// Explicit scenario budgets, fixed before inspecting performance. These are not
// automatic position sizes and do not substitute for historical fundamentals.
const schedules = {
  conservative: { p2: 0.5, p3: 1, p4: 2 },
  regular: { p2: 1, p3: 2, p4: 3 },
};
const directory = process.argv[2];
if (!directory)
  throw Error("Pass a directory containing symbol.csv daily OHLCV files.");
const asOf = "2026-10-01T22:00:00Z";
const hash = (x) => crypto.createHash("sha256").update(x).digest("hex");
const symbols = ["SPY", "AAPL", "NVDA", "INTC", "PYPL", "PFE", "F", "ARKK"];
const rows = symbols.map((symbol) => {
  const raw = fs.readFileSync(path.join(directory, `${symbol}.csv`), "utf8");
  assert.match(raw, /^datetime;open;high;low;close;volume/);
  const bars = raw
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [time, ...values] = line.split(";");
      const [open, high, low, close, volume] = values.map(Number);
      assert.ok(
        [open, high, low, close, volume].every(Number.isFinite),
        `${symbol}: nonfinite input`,
      );
      assert.ok(
        open > 0 &&
          close > 0 &&
          low > 0 &&
          high >= Math.max(open, close, low) &&
          low <= Math.min(open, close) &&
          volume >= 0,
        `${symbol}: invalid candle`,
      );
      return { time, open, high, low, close, volume };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
  assert.equal(
    new Set(bars.map((b) => b.time)).size,
    bars.length,
    `${symbol}: duplicate dates`,
  );
  const policy = researchAccumulation(bars, asOf);
  const runs = Object.entries(schedules).flatMap(([name, schedule]) =>
    [10, 50].map((costBps) => {
      const r = evaluateAccumulation(
        bars,
        asOf,
        costBps,
        "us-equity",
        "monthly-v5",
        schedule,
      );
      assert.equal(r.available, true);
      assert.equal(r.fixed.contributed, r.adaptive.contributed);
      assert.ok(
        r.history.every((h) => h.cash >= 0 && h.signalDate < h.executionDate),
      );
      const future = [
        ...bars,
        { time: "2030-12-31", open: 1, high: 1, low: 1, close: 1, volume: 1 },
      ];
      assert.deepEqual(
        evaluateAccumulation(
          future,
          asOf,
          costBps,
          "us-equity",
          "monthly-v5",
          schedule,
        ),
        r,
      );
      const cashOnly = policy.history.filter((s) => s.multiplier <= 1).length;
      return {
        name,
        schedule,
        costBps,
        months: r.months,
        from: r.history[0].month,
        through: r.history.at(-1).month,
        deposits: r.fixed.contributed,
        fixedValue: r.fixed.value,
        zoneValue: r.adaptive.value,
        differencePct: (r.adaptive.value / r.fixed.value - 1) * 100,
        fixedDrawdownPct: r.fixed.drawdown,
        zoneDrawdownPct: r.adaptive.drawdown,
        endingCash: r.adaptive.cash,
        laterWindowDifferencePct:
          (r.holdout.adaptive.value / r.holdout.fixed.value - 1) * 100,
        cashOnlySignalMonths: cashOnly,
        mechanicalChecks:
          "equal deposits; no borrowing; execution after signal; future-data invariant",
      };
    }),
  );
  return {
    symbol,
    rows: bars.length,
    from: bars[0].time,
    through: bars.at(-1).time,
    inputSha256: hash(raw),
    zones: Object.fromEntries(
      [0, 1, 2, 3, 4].map((level) => [
        level,
        policy.history.filter((s) => s.multiplier === level).length,
      ]),
    ),
    runs,
  };
});
const summary = Object.keys(schedules).flatMap((name) =>
  [10, 50].map((costBps) => {
    const runs = rows.map((r) =>
      r.runs.find((x) => x.name === name && x.costBps === costBps),
    );
    return {
      name,
      costBps,
      securities: runs.length,
      wins: runs.filter((r) => r.differencePct > 0).length,
      losses: runs.filter((r) => r.differencePct < 0).length,
      meanDifferencePct:
        runs.reduce((s, r) => s + r.differencePct, 0) / runs.length,
      medianDifferencePct:
        runs
          .map((r) => r.differencePct)
          .sort((a, b) => a - b)
          .slice(3, 5)
          .reduce((a, b) => a + b, 0) / 2,
    };
  }),
);
const report = {
  generatedAt: new Date().toISOString(),
  asOf,
  policySha256: hash(fs.readFileSync("lib/accumulation-policy-v5.ts")),
  evaluatorSha256: hash(fs.readFileSync("lib/accumulation-evaluation.ts")),
  decisionSha256: hash(fs.readFileSync("lib/auryn-decision.ts")),
  scope:
    "Price-zone cash-schedule research only; not a complete AURYN decision backtest.",
  limitations: [
    "Eight deliberately selected current securities, including one market ETF and one thematic ETF. Not a representative or point-in-time universe; survivorship bias remains.",
    "Historical business screens, valuation, earnings availability and risk overrides are not included. Current fundamentals are never backfilled into history.",
    "No dividends, cash interest or taxes. Adjustment conventions were not independently audited against corporate actions.",
    "Monthly deposit-adjusted drawdown misses intramonth losses. Later chronological windows are descriptive, not an independent holdout.",
    "Incomplete final months are excluded. No threshold or budget was selected after observing results.",
    "A zone is not a return forecast. This report cannot establish superiority, predict significant gains or certify every ticker.",
  ],
  summary,
  rows,
};
const output =
  process.argv[3] ?? "verification/pace-zone-history-20261027.json";
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ output, summary }, null, 2));
