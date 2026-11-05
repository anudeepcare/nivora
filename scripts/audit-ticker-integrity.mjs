import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { sourceModule } from "../tests/helpers/provider-fixture.mjs";
const { indicators } = sourceModule("lib/analysis.ts");
const { researchAccumulation } = sourceModule("lib/accumulation-policy-v5.ts");
const root = process.argv[2] || "verification/ticker-audit-20261104";
const asOf = process.argv[3] || "2026-11-04T00:00:00Z";
assert.ok(Number.isFinite(Date.parse(asOf)));
const rawRoot = process.argv[4] || `${root}/raw`;
const symbols = JSON.parse(fs.readFileSync(`${root}/universe.json`));
assert.ok(symbols.length>0);assert.equal(new Set(symbols).size,symbols.length);assert.ok(symbols.every(s=>/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(s)));
const closeTo = (a, b) =>
  assert.ok(
    Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b)),
    `${a} differs from ${b}`,
  );
const rows = symbols.map((symbol) => {
  const path=`${rawRoot}/${symbol}.json`;let input;try{input=JSON.parse(fs.readFileSync(path));}catch{input={raw:'History not retrieved or unreadable',source:null,retrievedAt:null}}if(typeof input.raw!=='string')input.raw='History response is missing';
  const row = {
    symbol,
    source: input.source,
    retrievedAt: input.retrievedAt,
    sha256: crypto.createHash("sha256").update(input.raw).digest("hex"),
    status: "unavailable",
    checks: [],
    external:{quotes:'not-compared',pace:'not-compared',scenarios:'not-compared',analysts:'not-compared',fundamentals:'not-compared',technicals:'not-compared'},
  };
  if (!input.raw.startsWith("datetime;"))
    return { ...row, reason: input.raw.slice(0, 180) };
  const bars = input.raw
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [time, ...v] = line.split(";");
      const [open, high, low, close, volume] = v.map(Number);
      return { time, open, high, low, close, volume };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
  if(!bars.length)return {...row,reason:"No dated observations"};
  const check = (name, fn) => {
    try {
      fn();
      row.checks.push({ name, status: "pass" });
    } catch (e) {
      row.checks.push({ name, status: "fail", reason: e.message });
    }
  };
  row.observations = bars.length;
  row.first = bars[0]?.time;
  row.last = bars.at(-1)?.time;
  check("OHLC integrity", () => {
    for (const b of bars) {
      assert.ok(
        [b.open, b.high, b.low, b.close].every(
          (n) => Number.isFinite(n) && n > 0,
        ),
      );
      assert.ok(b.high >= Math.max(b.open, b.close, b.low) - 1e-6);
      assert.ok(b.low <= Math.min(b.open, b.close, b.high) + 1e-6);
      assert.ok(Number.isFinite(b.volume) && b.volume >= 0);
    }
  });
  check("Unique dated observations", () =>
    assert.equal(new Set(bars.map((b) => b.time)).size, bars.length),
  );
  const past = bars.filter((b) => b.time < asOf.slice(0, 10)),
    t = indicators(bars, asOf),
    p = researchAccumulation(bars, asOf);
  if(!past.length)return {...row,reason:"No observations before cutoff"};
  row.reading = {
    close: t.close,
    ma50: t.ma50,
    ma200: t.ma200,
    rsi: t.rsi,
    confirmed: p.confirmed,
    forming: p.forming,
  };
  check("Latest close and SMA50/200 arithmetic", () => {
    closeTo(t.close, past.at(-1).close);
    for (const [n, k] of [
      [50, "ma50"],
      [200, "ma200"],
    ]) {
      if (past.length < n) assert.equal(t[k], null);
      else
        closeTo(
          t[k],
          past
            .slice(-n)
            .map((b) => b.close)
            .reduce((a, b) => a + b, 0) / n,
        );
    }
  });
  check("RSI independently recomputed with Wilder smoothing", () => {
    const deltas = past.slice(1).map((b, i) => b.close - past[i].close);
    if (deltas.length < 14) {
      assert.equal(t.rsi, null);
      return;
    }
    let up = deltas.slice(0, 14).reduce((s, v) => s + Math.max(v, 0), 0) / 14,
      down = deltas.slice(0, 14).reduce((s, v) => s + Math.max(-v, 0), 0) / 14;
    for (const d of deltas.slice(14)) {
      up += (Math.max(d, 0) - up) / 14;
      down += (Math.max(-d, 0) - down) / 14;
    }
    closeTo(
      t.rsi,
      up === 0 && down === 0
        ? 50
        : down === 0
          ? 100
          : 100 - 100 / (1 + up / down),
    );
  });
  check("Fibonacci arithmetic and bounds", () => {
    for (const f of t.fib) {
      closeTo(f.price, t.high * (1 - f.ratio) + t.low * f.ratio);
      assert.ok(f.price >= t.low && f.price <= t.high);
    }
  });
  check("Relative volume excludes current bar from baseline", () => {
    const prior = past.slice(-21, -1);
    const mean = prior.reduce((s, b) => s + b.volume, 0) / 20;
    if (prior.length === 20 && mean > 0)
      closeTo(t.volumeRatio, past.at(-1).volume / mean);
  });
  check("Future observations cannot change past Pace or technicals", () => {
    const future = [
      ...bars,
      { time: "2030-01-31", open: 1, high: 1, low: 1, close: 1, volume: 1 },
    ];
    assert.deepEqual(researchAccumulation(future, asOf), p);
    assert.deepEqual(indicators(future, asOf), t);
  });
  check("Historical Pace is prefix invariant at three cutoffs", () => {
    for (const date of ["2026-03-02", "2026-07-01", "2026-10-01"]) {
      const cut = bars.filter((b) => b.time < date);
      assert.deepEqual(
        researchAccumulation(bars, date + "T00:00:00Z"),
        researchAccumulation(cut, date + "T00:00:00Z"),
      );
    }
  });
  check("Completed and forming month identities", () => {
    if (p.confirmed) assert.ok(p.confirmed.month < asOf.slice(0, 7));
    if (p.forming) assert.equal(p.forming.month, asOf.slice(0, 7));
    for (const h of p.history)
      assert.ok([0, 1, 2, 3, 4].includes(h.multiplier));
  });
  row.status = row.checks.some((c) => c.status === "fail") ? "fail" : "pass";
  return row;
});
const report = {
  asOf,
  generatedAt: new Date().toISOString(),
  sample:
    "Predeclared convenience sample, not representative or survivorship-free.",
  scope:
    "Price-history integrity and production Pace/technical calculation checks. Not independent market-data reconciliation or investment-performance validation.",
  limitations: [
    "Single provider; split adjustments and dividends not independently reconciled.",
    "Financial statements, analyst estimates, options/gamma and news are NOT verified by this run.",
    "500 daily observations requested; long-history metrics may be unavailable.",
    "Competitor proprietary zones are not accuracy ground truth.",
  ],
  summary: {
    requested: symbols.length,
    usable: rows.filter((r) => r.status !== "unavailable").length,
    passed: rows.filter((r) => r.status === "pass").length,
    failed: rows.filter((r) => r.status === "fail").length,
    unavailable: rows.filter((r) => r.status === "unavailable").length,
    checks: rows.flatMap((r) => r.checks).length,
  },
  rows,
};
fs.writeFileSync(
  `${root}/results.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      summary: report.summary,
      failures: rows
        .filter((r) => r.status === "fail")
        .map((r) => ({
          symbol: r.symbol,
          checks: r.checks.filter((c) => c.status === "fail"),
        })),
      unavailable: rows
        .filter((r) => r.status === "unavailable")
        .map((r) => ({ symbol: r.symbol, reason: r.reason })),
    },
    null,
    2,
  ),
);

const columns=['symbol','status','close','asOf','sma50','sma200','rsi14','confirmedPace','formingPace','quoteComparison','paceComparison','scenarioComparison','analystComparison','fundamentalComparison','technicalComparison','reason'];const csv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
fs.writeFileSync(`${root}/ticker-results.csv`,[columns.join(','),...rows.map(r=>[r.symbol,r.status,r.reading?.close,r.last,r.reading?.ma50,r.reading?.ma200,r.reading?.rsi,r.reading?.confirmed?.multiplier,r.reading?.forming?.multiplier,r.external.quotes,r.external.pace,r.external.scenarios,r.external.analysts,r.external.fundamentals,r.external.technicals,r.reason??''].map(csv).join(','))].join('\n')+'\n');
