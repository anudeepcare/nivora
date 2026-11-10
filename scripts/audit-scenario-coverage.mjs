// Market-wide coverage audit for the scenario cross-check and Pace ladder.
// Reads the same raw daily-history folder as audit-ticker-integrity.mjs:
//   <root>/universe.json            ["AAPL","MSFT",...]
//   <rawRoot>/<SYMBOL>.json         { raw: "datetime;open;high;low;close;volume\n...", source, retrievedAt }
// Usage: node --experimental-strip-types scripts/audit-scenario-coverage.mjs <root> [asOf ISO] [rawRoot] [--ladder]
// It measures coverage and internal consistency on real histories. It does not measure forecast accuracy.
import fs from "node:fs";
import { scenarioLenses } from "../lib/scenario-lenses.ts";
import { priceRiskScenarios } from "../lib/price-risk-scenarios.ts";
import { pacePriceZones } from "../lib/pace-price-zones.ts";
import { paceLadder } from "../lib/pace-ladder.ts";

const args = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const ladder = process.argv.includes("--ladder");
const root = args[0];
if (!root) throw Error("Pass the audit folder containing universe.json.");
const rawRoot = args[2] || `${root}/raw`;
const symbols = JSON.parse(fs.readFileSync(`${root}/universe.json`, "utf8"));
const good = (x) => typeof x === "number" && Number.isFinite(x) && x > 0;
const rows = [];
for (const symbol of symbols) {
  const row = { symbol, status: "unavailable", lenses: [], problems: [] };
  rows.push(row);
  let input;
  try {
    input = JSON.parse(fs.readFileSync(`${rawRoot}/${symbol}.json`, "utf8"));
  } catch {
    row.reason = "History not retrieved or unreadable";
    continue;
  }
  if (typeof input.raw !== "string" || !input.raw.startsWith("datetime;")) {
    row.reason = String(input.raw ?? "History response is missing").slice(0, 160);
    continue;
  }
  const history = input.raw.trim().split("\n").slice(1).map((line) => {
    const [time, ...v] = line.split(";");
    const [open, high, low, close, volume] = v.map(Number);
    return { time: time.slice(0, 10), open, high, low, close, volume };
  }).sort((a, b) => a.time.localeCompare(b.time));
  const last = history.at(-1);
  if (!last) { row.reason = "No dated observations"; continue; }
  const asOf = args[1] || `${last.time}T23:00:00Z`;
  const crypto = symbol.includes("/");
  const research = {
    company: { symbol, name: symbol, exchange: crypto ? "CRYPTO" : "NASDAQ", assetType: crypto ? "crypto" : "stock", currency: "USD" },
    quote: { price: last.close, changePct: null, currency: "USD", asOf: `${last.time}T21:00:00Z`, session: "closed", source: input.source ?? "audit", stale: false },
    history, facts: [], filings: [], issues: [], retrievedAt: asOf, priceObservedAt: asOf,
  };
  row.observations = history.length;
  row.first = history[0].time;
  row.last = last.time;
  try {
    const v = scenarioLenses(research);
    if (!v.available) { row.reason = v.reason; }
    else {
      row.status = "covered";
      row.lenses = v.lenses.map((x) => ({ id: x.id, bear: x.bear, base: x.base, bull: x.bull }));
      row.warnings = v.warnings;
      for (const x of v.lenses) {
        if (!good(x.base) || (x.bear != null && !(good(x.bear) && x.bear <= x.base)) || (x.bull != null && !(good(x.bull) && x.base <= x.bull)))
          row.problems.push(`${x.id}: unordered or non-positive case`);
      }
      const again = scenarioLenses(structuredClone(research));
      if (JSON.stringify(again) !== JSON.stringify(v)) row.problems.push("not reproducible");
    }
    for (const options of [{}, { horizon: 252 }]) {
      const h = priceRiskScenarios(research, options);
      if (h.available && !(h.cases[0].target <= h.cases[1].target && h.cases[1].target <= h.cases[2].target))
        row.problems.push(`history ${h.horizon}: unordered percentiles`);
    }
    if (ladder) {
      const zones = await pacePriceZones(history, asOf, "forming", crypto ? "crypto" : "us-equity");
      if (zones) {
        const steps = paceLadder(zones);
        const current = steps.find((s) => s.current);
        row.ladder = steps.map((s) => ({ level: s.level, price: s.price, relation: s.relation, bands: s.bands }));
        for (const s of steps) {
          if (s.price == null) continue;
          if (s.relation === "at-or-below" && s.price > zones.reference) row.problems.push(`P${s.level}: below-edge above price`);
          if (s.relation === "at-or-above" && s.price < zones.reference) row.problems.push(`P${s.level}: above-edge below price`);
          if (current && s.level > current.level && s.relation === "at-or-above" && zones.ranges.some((x) => x.level === s.level && x.high <= zones.reference))
            row.problems.push(`P${s.level}: deeper stage shown above price despite a lower band`);
        }
        row.disconnected = steps.some((s) => s.bands > 1);
      } else row.ladder = null;
    }
  } catch (error) {
    row.status = "error";
    row.problems.push(String(error?.stack ?? error).slice(0, 300));
  }
  if (row.problems.length) row.status = "failed";
}
const count = (f) => rows.filter(f).length;
const has = (id) => count((r) => r.lenses.some((x) => x.id === id));
const summary = {
  requested: rows.length,
  covered: count((r) => r.status === "covered"),
  unavailable: count((r) => r.status === "unavailable"),
  failed: count((r) => r.status === "failed" || r.status === "error"),
  oneYearRow: has("history-12m"),
  threeMonthRow: has("history-3m"),
  oneMonthRow: has("history-1m"),
  splitOrBadTickWarnings: count((r) => r.warnings?.length),
  ...(ladder ? { laddersScanned: count((r) => r.ladder), disconnectedZones: count((r) => r.disconnected) } : {}),
};
const out = {
  generatedAt: new Date().toISOString(),
  scope: "Coverage and internal consistency of the scenario cross-check (history rows only; no analyst or fundamental inputs are supplied here) and, with --ladder, the Pace ladder presentation.",
  limitations: [
    "Single provider history; split adjustments are not independently reconciled, only flagged.",
    "Analyst targets, AURYN models and revenue spread are not exercised by this run.",
    "Consistency is not forecast accuracy. No predictive validation is performed.",
  ],
  summary,
  rows,
};
fs.writeFileSync(`${root}/scenario-coverage.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(summary));
if (summary.failed) process.exitCode = 1;
