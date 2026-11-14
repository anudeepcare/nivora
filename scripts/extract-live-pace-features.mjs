import fs from "node:fs";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "../lib/accumulation-policy-v5.ts";
import { paceFeatures } from "../lib/pace-classifier.ts";
const base = process.argv[2];
const report = JSON.parse(fs.readFileSync(base + "/analysis/replay.json"));
const reference = JSON.parse(fs.readFileSync(base + "/dca-screener-1000.json"));
const companies = new Map(reference.rows.map((r) => [r.cells[0], r.cells[1]]));
const rows = [];
for (const r of report.rows.filter(
  (r) => r.status === "compared" && r.market === "us-equity" && r.priceAligned,
)) {
  const bars = fs
    .readFileSync(base + "/raw/" + r.symbol + ".csv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => {
      const [time, o, h, lo, c, v] = l.split(";");
      return { time, open: +o, high: +h, low: +lo, close: +c, volume: +v };
    })
    .filter((b) => b.time <= r.closeDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const asOf = r.closeDate + "T23:59:59Z";
  const settled = adaptiveSettledBars(bars, asOf, r.market);
  const result = researchAccumulation(settled, asOf, r.market);
  const s = result.forming ?? result.confirmed;
  const features =
    s &&
    paceFeatures(
      settled.filter((b) => b.time <= s.date),
      s.z,
      s.deviation / 100,
    );
  rows.push({
    ...r,
    company: companies.get(r.symbol),
    features,
    legacyTrim: s?.multiplier === 0 ? (s.trimTier === "strong" ? 6 : 5) : null,
  });
}
fs.writeFileSync(base + "/analysis/features.json", JSON.stringify(rows));
console.log(
  JSON.stringify({
    rows: rows.length,
    features: rows.filter((r) => r.features).length,
  }),
);
