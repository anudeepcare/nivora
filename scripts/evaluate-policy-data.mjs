// Locally supplied OHLCV CSV strings; no credentials or network requests.
import fs from "node:fs";
import { candidatePolicy } from "../lib/accumulation-policy.ts";
import { evaluatePolicies } from "../lib/policy-evaluation.ts";
const file = process.argv[2];
if (!file)
  throw Error(
    "Usage: node --experimental-strip-types scripts/evaluate-policy-data.mjs INPUT.json [AS_OF]",
  );
const asOf = process.argv[3] ?? new Date().toISOString(),
  input = JSON.parse(fs.readFileSync(file, "utf8")),
  results = [];
for (const [symbol, csv] of Object.entries(input)) {
  const lines = csv.trim().split(/\r?\n/),
    header = lines.shift().split(";"),
    bars = lines
      .filter(Boolean)
      .map((line) => {
        const cells = line.split(";"),
          row = Object.fromEntries(header.map((k, i) => [k, cells[i]]));
        return {
          time: row.datetime.slice(0, 10),
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: row.volume == null ? 0 : Number(row.volume),
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  const market = symbol.includes("/") ? "crypto" : "us-equity",
    candidate = candidatePolicy(bars, asOf, market),
    evaluation = evaluatePolicies(bars, asOf, 10, market),
    brief = (x) => ({
      terminalModelUnits: x.value,
      deposits: x.contributed,
      cash: x.cash,
      costs: x.costs,
      flowAdjustedMonthEndDrawdown: x.drawdown,
    });
  results.push({
    symbol,
    observations: bars.length,
    first: bars[0]?.time,
    last: bars.at(-1)?.time,
    candidateEligibleMonths: candidate.history.length,
    confirmedMonth: candidate.confirmed?.month ?? null,
    ...(evaluation.available
      ? {
          evaluation: {
            months: evaluation.months,
            costBps: evaluation.costBps,
            normal: brief(evaluation.fixed),
            original: brief(evaluation.original),
            candidate: brief(evaluation.candidate),
            holdout: {
              start: evaluation.holdout.start,
              end: evaluation.holdout.end,
              months: evaluation.holdout.months,
              normal: brief(evaluation.holdout.fixed),
              original: brief(evaluation.holdout.original),
              candidate: brief(evaluation.holdout.candidate),
            },
          },
        }
      : {
          evaluation: {
            unavailable: evaluation.reason,
            eligibleMonths: evaluation.eligibleMonths,
          },
        }),
  });
}
console.log(
  JSON.stringify(
    {
      asOf,
      models: ["monthly-v1", "monthly-v2-candidate"],
      source:
        "Twelve Data connector, requested daily histories through 2026-10-16; each actual last observation is reported separately.",
      scope:
        "Small selected-series integration check, not representative market-wide testing or independently validated holdout. No parameters optimized by this script.",
      limitations: [
        "Source history adjustments were not independently reconciled against exchange records.",
        "Price-only; dividends, taxes, delisted names and point-in-time company evidence are not modeled.",
        "Observed histories are not bundled; supply licensed data locally to reproduce.",
        "These results do not establish an investment edge or forecast future returns.",
      ],
      results,
    },
    null,
    2,
  ),
);
