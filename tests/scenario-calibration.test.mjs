import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rangeCalibration, rangeBounds, riskAdjustedRange, MIN_CALIBRATION_TESTS } from "../lib/scenario-calibration.ts";
import { scenarioLenses } from "../lib/scenario-lenses.ts";
import { rng, universe } from "./helpers/market-universe.mjs";

const AS_OF = "2026-11-06T23:00:00Z";
function walk(n, seed, vol = () => 0.02, drift = 0) {
  const r = rng(seed), bars = [];
  let price = 100;
  for (let t = Date.UTC(2026, 10, 6); bars.length < n; t -= 86400000) {
    const d = new Date(t);
    if (![0, 6].includes(d.getUTCDay())) bars.unshift({ time: d.toISOString().slice(0, 10) });
  }
  return bars.map((b, i) => {
    const g = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    price *= Math.exp(drift + vol(i) * g);
    return { ...b, open: price, high: price, low: price, close: price, volume: 1 };
  });
}

test("ranges are built only from prices known at the time: later bars never change an earlier bound", () => {
  const bars = walk(900, 5), close = bars.map((b) => b.close);
  for (const method of ["empirical", "risk-adjusted"]) {
    const a = rangeBounds(close, 500, 20, method);
    const altered = close.map((c, i) => (i > 500 ? c * 7 : c));
    assert.deepEqual(rangeBounds(altered, 500, 20, method), a, method);
    assert.ok(a[0] < a[1] && a[1] < a[2], method);
  }
  assert.equal(rangeBounds(close, 30, 20, "empirical"), null);
  assert.equal(rangeBounds([1, NaN, 2, ...close], 200, 20, "empirical"), null);
});

test("on steady random walks both methods contain close to the designed 80% of outcomes", () => {
  for (const method of ["empirical", "risk-adjusted"]) {
    let inside = 0, tests = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const c = rangeCalibration(walk(1500, seed), AS_OF, 20, "us-equity", method);
      inside += c.inside; tests += c.tests;
      assert.equal(c.inside + c.below + c.above, c.tests);
    }
    const rate = (inside / tests) * 100;
    assert.ok(rate > 74 && rate < 86, `${method} ${rate.toFixed(1)}% over ${tests}`);
  }
});

test("when volatility shifts between regimes the volatility-adjusted range holds more often than raw percentiles", () => {
  const score = (method) => {
    let inside = 0, tests = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const c = rangeCalibration(walk(1500, seed, (i) => (Math.floor(i / 180) % 2 ? 0.045 : 0.012)), AS_OF, 20, "us-equity", method);
      inside += c.inside; tests += c.tests;
    }
    return (inside / tests) * 100;
  };
  const raw = score("empirical"), adjusted = score("risk-adjusted");
  assert.ok(adjusted > raw + 2, `adjusted ${adjusted.toFixed(1)}% vs raw ${raw.toFixed(1)}%`);
  assert.ok(Math.abs(adjusted - 80) < Math.abs(raw - 80));
});

test("verdicts need enough scored ranges and report narrow ranges honestly", () => {
  const few = rangeCalibration(walk(400, 3), AS_OF, 63);
  assert.ok(few.available && few.tests < MIN_CALIBRATION_TESTS);
  assert.equal(few.verdict, "too-few");
  // A strong past uptrend that then reverses: drift-laden percentiles sit too high.
  const bars = walk(1500, 9, () => 0.01, 0.004).map((b, i, all) => (i > 900 ? { ...b, close: all[900].close * Math.exp(-0.004 * (i - 900)) } : b));
  const c = rangeCalibration(bars, AS_OF, 20);
  assert.ok(c.below > c.above);
  assert.equal(rangeCalibration(walk(50, 1), AS_OF, 20).available, false);
  assert.equal(rangeCalibration(walk(900, 1), AS_OF, 2).available, false);
  assert.equal(rangeCalibration([], AS_OF, 20).available, false);
});

test("the volatility-adjusted row is centred on today's price, widens with current volatility and carries its record", () => {
  const calm = walk(900, 11, (i) => (i > 840 ? 0.008 : 0.02)), wild = walk(900, 11, (i) => (i > 840 ? 0.06 : 0.02));
  const a = riskAdjustedRange(calm, AS_OF, 20), b = riskAdjustedRange(wild, AS_OF, 20);
  assert.ok(a.bear < 0 && a.bull > 0 && b.bear < 0 && b.bull > 0);
  assert.ok(b.bull - b.bear > (a.bull - a.bear) * 1.5);
  const price = wild.at(-1).close;
  const v = scenarioLenses({
    company: { symbol: "T", exchange: "NASDAQ", assetType: "stock", currency: "USD" }, history: wild, facts: [], filings: [], issues: [],
    quote: { price, changePct: 0, currency: "USD", asOf: "2026-11-06T21:00:00Z", session: "closed", source: "t", stale: false }, retrievedAt: AS_OF,
  });
  const row = v.lenses.find((x) => x.id === "risk-adjusted");
  assert.equal(row.base, v.reference.price);
  assert.equal(row.neutralBase, true);
  assert.equal(row.track.method, "risk-adjusted");
  assert.ok(v.lenses.filter((x) => x.kind === "history").every((x) => x.track?.method === "empirical"));
  assert.ok(!v.agreement.compared.includes("risk-adjusted"));
});

test("measured on the real histories in the repo and the synthetic market, the adjusted range is not worse than raw percentiles", () => {
  const tally = { empirical: [0, 0], "risk-adjusted": [0, 0] };
  const add = (bars, asOf, market) => {
    for (const method of Object.keys(tally)) {
      const c = rangeCalibration(bars, asOf, 20, market, method);
      if (c.available) { tally[method][0] += c.inside; tally[method][1] += c.tests; }
    }
  };
  for (const { bars } of JSON.parse(fs.readFileSync("tests/fixtures/pace-v6-bars.json", "utf8"))) add(bars, "2026-11-06T22:00:00Z", "us-equity");
  const real = Object.fromEntries(Object.entries(tally).map(([k, [i, n]]) => [k, (i / n) * 100]));
  assert.ok(real["risk-adjusted"] >= real.empirical, JSON.stringify(real));
  for (const { research } of universe(6)) add(research.history, research.retrievedAt, research.company.assetType === "crypto" ? "crypto" : "us-equity");
  const all = Object.fromEntries(Object.entries(tally).map(([k, [i, n]]) => [k, (i / n) * 100]));
  assert.ok(all["risk-adjusted"] >= all.empirical, JSON.stringify(all));
  console.log("walk-forward 20-session hit rate (target 80%)", JSON.stringify({ real, all, tests: tally.empirical[1] }));
});
