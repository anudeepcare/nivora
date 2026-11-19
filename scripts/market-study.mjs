// Broad-market study on real daily histories (one JSON per symbol: { symbol, type, bars: [[date,o,h,l,c,v],...] }).
// Usage: node --experimental-strip-types scripts/market-study.mjs <rawDir> <outFile> [shard] [shards]
// Measures: scenario coverage, walk-forward range hit rates, and forward returns after each monthly Pace level.
// Price only: historical fundamentals are not available here, so business checks are NOT part of this record.
import fs from "node:fs";
import { researchAccumulation } from "../lib/accumulation-policy-v6.ts";
import { rangeCalibration } from "../lib/scenario-calibration.ts";
import { scenarioLenses } from "../lib/scenario-lenses.ts";
const [dir, outFile, shard = "0", shards = "1"] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().filter((_, i) => i % +shards === +shard);
const out = { symbols: 0, skipped: 0, errors: [], coverage: { covered: 0, unavailable: 0, problems: 0, warnings: 0, rows: {} }, calibration: {}, pace: [], sample: null };
for (const f of files) {
  const { symbol, bars: raw } = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
  const bars = raw.filter((b) => b.slice(1, 5).every((x) => typeof x === "number" && x > 0)).map(([time, open, high, low, close, volume]) => ({ time, open, high: Math.max(open, high, low, close), low: Math.min(open, high, low, close), close, volume }));
  if (bars.length < 300) { out.skipped++; continue; }
  out.symbols++;
  const last = bars.at(-1), asOf = `${last.time}T23:00:00Z`;
  try {
    const research = { company: { symbol, name: symbol, exchange: "NASDAQ", assetType: "stock", currency: "USD" }, quote: { price: last.close, changePct: null, currency: "USD", asOf: `${last.time}T21:00:00Z`, session: "closed", source: "study", stale: false }, history: bars, facts: [], filings: [], issues: [], retrievedAt: asOf, priceObservedAt: asOf };
    const v = scenarioLenses(research);
    if (!v.available) out.coverage.unavailable++;
    else {
      out.coverage.covered++;
      if (v.warnings.length) out.coverage.warnings++;
      for (const x of v.lenses) {
        out.coverage.rows[x.id] = (out.coverage.rows[x.id] ?? 0) + 1;
        if (!(x.base > 0) || (x.bear != null && !(x.bear > 0 && x.bear <= x.base)) || (x.bull != null && !(x.base <= x.bull && Number.isFinite(x.bull)))) out.coverage.problems++;
      }
    }
    for (const h of [20, 63, 252]) for (const m of h === 252 ? ["empirical"] : ["empirical", "risk-adjusted"]) {
      const c = rangeCalibration(bars, asOf, h, "us-equity", m);
      if (!c.available) continue;
      const k = `${m}:${h}`, a = (out.calibration[k] ??= { tests: 0, inside: 0, below: 0, above: 0, stocks: 0 });
      a.tests += c.tests; a.inside += c.inside; a.below += c.below; a.above += c.above; a.stocks++;
    }
    const acc = researchAccumulation(bars, asOf, "us-equity");
    if (!out.sample && acc.history?.length) out.sample = Object.keys(acc.history[0]);
    const index = new Map(bars.map((b, i) => [b.time, i]));
    for (const s of acc.history ?? []) {
      const i = index.get(s.date);
      if (i == null || !Number.isInteger(s.multiplier)) continue;
      const fwd = (n) => (i + n < bars.length ? +(bars[i + n].close / bars[i].close - 1).toFixed(4) : null);
      let low = Infinity;
      for (let k = i + 1; k <= Math.min(i + 126, bars.length - 1); k++) low = Math.min(low, bars[k].close);
      out.pace.push([s.multiplier, s.date.slice(0, 7), fwd(63), fwd(126), fwd(252), i + 126 < bars.length ? +(low / bars[i].close - 1).toFixed(4) : null, s.policyVersion === "monthly-v6" ? 6 : 5]);
    }
  } catch (e) { out.errors.push(`${symbol}: ${String(e?.message ?? e).slice(0, 160)}`); }
}
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(shard, out.symbols, "symbols", out.pace.length, "pace months", out.errors.length, "errors");
