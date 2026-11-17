import fs from "node:fs";
import { createHash } from "node:crypto";
const hash = (x) => createHash("sha256").update(x).digest("hex");
const positional = process.argv.slice(2).filter((x) => !x.startsWith("--"));
import { researchAccumulation } from "../lib/accumulation-policy-v7.ts";
const base = positional[0];
if (!base)
  throw new Error(
    "Usage: node scripts/replay-reference-snapshot.mjs /path/to/reference-folder [output.json]",
  );
const input = JSON.parse(fs.readFileSync(base + "/dca-screener-1000.json"));
const rows = [];
const label = (s) =>
  s == null
    ? null
    : s.multiplier === 0
      ? s.trimTier === "strong"
        ? "STRONG TRIM"
        : "LIGHT TRIM"
      : `${s.multiplier}X DCA`;
for (const r of input.rows) {
  const [symbol, , priceText, verdictText, , signalDate] = r.cells;
  const filename =
    base + "/raw/" + symbol.replace(/[^A-Za-z0-9.-]/g, "_") + ".csv";
  if (!fs.existsSync(filename)) {
    rows.push({ symbol, status: "missing-history" });
    continue;
  }
  const raw = fs.readFileSync(filename, "utf8");
  const expected = verdictText.split("\n")[0];
  const referencePrice = Number(
    priceText.match(/\$([\d,.]+)/)?.[1].replaceAll(",", ""),
  );
  const dateText = priceText.match(/([A-Z][a-z]{2} \d{1,2}, \d{4}) close/)?.[1];
  if (!raw.startsWith("datetime;") || !dateText) {
    rows.push({ symbol, status: "input-error", detail: raw.slice(0, 200) });
    continue;
  }
  const closeDate = new Date(dateText).toISOString().slice(0, 10);
  const bars = raw
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => {
      const [time, open, high, low, close, volume] = l.split(";");
      return {
        time,
        open: +open,
        high: +high,
        low: +low,
        close: +close,
        volume: +volume,
      };
    })
    .filter((b) => b.time <= closeDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const started = performance.now();
  const market = symbol === "BTCUSD" ? "crypto" : "us-equity";
  const result = researchAccumulation(bars, "2026-11-12T04:00:00Z", market);
  const actual = label(result.forming ?? result.confirmed);
  const last = bars.at(-1);
  rows.push({
    symbol,
    historySha256: hash(raw),
    market,
    status: "compared",
    referencePrice,
    providerPrice: last?.close,
    closeDate,
    providerDate: last?.time,
    priceAligned:
      last?.time === closeDate &&
      Math.abs(last.close - referencePrice) <= 0.011,
    expected,
    actual,
    match: actual === expected,
    confirmed: label(result.confirmed),
    forming: label(result.forming),
    policy: result.version,
    bars: bars.length,
    signalDate,
    ms: Math.round(performance.now() - started),
  });
}
const compared = rows.filter((r) => r.status === "compared"),
  aligned = compared.filter((r) => r.priceAligned);
const report = {
  scope:
    "Post-fit v7 replay at model release, including fitting rows. Monthly Standard reference snapshot; exact category agreement, not investment outcome accuracy. Alphabetical selection, not a random market sample.",
  denominatorIncludesMissing: true,
  referenceSha256: hash(fs.readFileSync(base + "/dca-screener-1000.json")),
  modelSha256: hash(
    fs.readFileSync(new URL("../lib/pace-model-v7.json", import.meta.url)),
  ),
  allRequestedMatchRate:
    compared.filter((r) => r.match).length / input.rows.length,
  samePriceMatchRate: aligned.length
    ? aligned.filter((r) => r.match).length / aligned.length
    : null,
  capturedAt: input.capturedAt,
  requested: input.rows.length,
  processed: rows.length,
  compared: compared.length,
  matches: compared.filter((r) => r.match).length,
  priceAligned: aligned.length,
  alignedMatches: aligned.filter((r) => r.match).length,
  completeExactMatch:
    rows.length === input.rows.length &&
    aligned.length === input.rows.length &&
    aligned.every((r) => r.match),
  byReference: Object.fromEntries(
    [...new Set(compared.map((r) => r.expected))].sort().map((k) => {
      const xs = compared.filter((r) => r.expected === k);
      return [
        k,
        { count: xs.length, matches: xs.filter((r) => r.match).length },
      ];
    }),
  ),
  errors: rows.filter((r) => r.status !== "compared"),
  rows,
};
fs.writeFileSync(
  positional[1] ?? base + "/analysis/replay-v7.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify({ ...report, rows: undefined }));
if (process.argv.includes("--require-exact") && !report.completeExactMatch)
  process.exitCode = 1;
