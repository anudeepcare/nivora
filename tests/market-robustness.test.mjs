import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { universe, rng, ARCHETYPES } from "./helpers/market-universe.mjs";
import { scenarioLenses } from "../lib/scenario-lenses.ts";
import { priceRiskScenarios } from "../lib/price-risk-scenarios.ts";
import { pacePriceZones } from "../lib/pace-price-zones.ts";
import { paceLadder } from "../lib/pace-ladder.ts";
import { portfolioRange } from "../lib/portfolio-range.ts";
import { portfolioDay } from "../lib/portfolio-day.ts";
import * as format from "../lib/format.ts";
import * as decision from "../lib/auryn-decision.ts";
import * as outlook from "../lib/outlook.ts";
import * as lensLib from "../lib/scenario-lenses.ts";
import * as dayLib from "../lib/portfolio-day.ts";

const market = universe(16);
const good = (x) => typeof x === "number" && Number.isFinite(x) && x > 0;
const css = new Proxy({}, { get: (_, key) => String(key) });
function component(file, modules) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
      if (name.endsWith(".module.css")) return { __esModule: true, default: css };
      if (name === "next/link") return { __esModule: true, default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children) };
      if (name in modules) return modules[name];
      throw Error(`Unexpected import ${name} in ${file}`);
    },
    mod,
    mod.exports,
  );
  return mod.exports.default;
}
const clean = (html, label) => assert.doesNotMatch(html, /NaN|Infinity|undefined|\[object|\$-|−\$0\.00 ·/, label);

test(`scenario cross-check holds its invariants across ${market.length} synthetic instruments in ${ARCHETYPES.length} market shapes`, () => {
  const coverage = {};
  for (const { kind, research } of market) {
    const label = `${kind} ${research.company.symbol}`;
    let v;
    assert.doesNotThrow(() => (v = scenarioLenses(research)), label);
    coverage[kind] ??= { total: 0, available: 0 };
    coverage[kind].total++;
    if (!v.available) {
      assert.ok(v.reason.length > 20, label);
      continue;
    }
    coverage[kind].available++;
    assert.ok(good(v.reference.price), label);
    assert.ok(v.lenses.includes(v.primary), label);
    assert.equal(new Set(v.lenses.map((x) => x.id)).size, v.lenses.length, label);
    for (const x of v.lenses) {
      assert.ok(good(x.base), `${label} ${x.id} base`);
      for (const side of [x.bear, x.bull]) assert.ok(side === null || good(side), `${label} ${x.id}`);
      if (x.bear != null) assert.ok(x.bear <= x.base, `${label} ${x.id} bear<=base`);
      if (x.bull != null) assert.ok(x.base <= x.bull, `${label} ${x.id} base<=bull`);
      assert.ok(x.note.length > 20 && x.horizon.length > 3, label);
    }
    for (const e of Object.values(v.envelope)) if (e) assert.ok(good(e.low) && e.low <= e.high && e.count >= 1, label);
    assert.ok(v.agreement.spread === null || v.agreement.spread >= 0, label);
    assert.equal(v.agreement.level === "single", v.agreement.compared.length < 2, label);
    if (v.position.state === "inside") assert.ok(v.position.percent >= 0 && v.position.percent <= 100, label);
    if (v.asymmetry?.ratio != null) assert.ok(good(v.asymmetry.ratio), label);
  }
  // Coverage expectations: enough history must always produce a view; too little never fabricates one.
  for (const kind of ["large-cap", "high-growth", "penny", "sub-cent", "mega-price", "meme-volatile", "flat-utility", "crashed", "crypto", "etf", "descending-order", "duplicate-dates", "split-unadjusted", "analyst-full", "non-usd-listing"])
    assert.equal(coverage[kind].available, coverage[kind].total, `${kind} should always be covered`);
  assert.equal(coverage["recent-ipo"].available, coverage["recent-ipo"].total, "recent listings get the 1-month row");
  // Under 80 sessions there is no historical row; only a supplied analyst target can appear.
  for (const { kind, research } of market.filter((m) => m.kind === "new-listing")) {
    const v = scenarioLenses(research);
    if (v.available) assert.deepEqual(v.lenses.map((x) => x.kind), ["analyst"], kind);
    else assert.equal(research.evidence.consensus.target, undefined, kind);
  }
});

test("specific market shapes behave as documented, never by accident", () => {
  for (const { kind, research } of market) {
    const v = scenarioLenses(research), ids = v.available ? v.lenses.map((x) => x.id) : [];
    if (kind === "recent-ipo") assert.ok(ids.includes("history-1m") && !ids.includes("history-12m"), kind);
    if (kind === "analyst-full") {
      const a = v.lenses.find((x) => x.id === "analyst");
      assert.ok(a && a.bear != null && a.bull != null, kind);
    }
    if (kind === "analyst-unordered") {
      const a = v.lenses.find((x) => x.id === "analyst");
      assert.ok(a && a.bear === null && a.bull === null, "an unordered analyst range is withheld, consensus kept");
    }
    if (kind === "analyst-stale") assert.ok(!ids.includes("analyst"), kind);
    if (kind === "crypto") assert.ok(!ids.includes("analyst") && !ids.includes("model") && !ids.includes("revenue"), kind);
    if (kind === "split-unadjusted") assert.ok(v.warnings.length >= 1, `${research.company.symbol} split flagged`);
    if (kind === "stale-quote" && v.available) assert.equal(v.reference.basis, "settled-close", kind);
    if (kind === "bad-ticks" && v.available) for (const x of v.lenses) assert.ok(good(x.base), kind);
  }
});

test("one-year and default historical ranges stay ordered, finite and reproducible on every instrument", () => {
  for (const { kind, research } of market)
    for (const options of [{}, { horizon: 252 }]) {
      const a = priceRiskScenarios(research, options);
      assert.deepEqual(priceRiskScenarios(structuredClone(research), options), a, kind);
      if (!a.available) continue;
      assert.ok(a.cases[0].target <= a.cases[1].target && a.cases[1].target <= a.cases[2].target, kind);
      assert.ok(a.cases.every((c) => good(c.target) && Number.isFinite(c.change)), kind);
      assert.ok(a.independent >= 1 && a.independent <= a.samples, kind);
    }
});

test("Pace ladder is valid on real classifier scans of varied synthetic histories", async () => {
  const picks = ["large-cap", "high-growth", "penny", "meme-volatile", "crashed", "flat-utility", "mega-price", "halted-gaps", "split-unadjusted", "sub-cent"]
    .flatMap((kind) => market.filter((m) => m.kind === kind).slice(0, 2));
  let scanned = 0;
  for (const { kind, research } of picks) {
    const zones = await pacePriceZones(research.history, research.retrievedAt, "forming");
    if (!zones) continue;
    scanned++;
    const steps = paceLadder(zones);
    assert.equal(steps.length, 5, kind);
    assert.ok(steps.filter((x) => x.current).length <= 1, kind);
    const current = steps.find((x) => x.current);
    for (const s of steps) {
      assert.equal(s.price === null, s.relation === null, kind);
      if (s.price == null) { assert.equal(s.bands, 0, kind); continue; }
      assert.ok(good(s.price), kind);
      if (s.relation === "at-or-below") assert.ok(s.price <= zones.reference, kind);
      if (s.relation === "at-or-above") assert.ok(s.price >= zones.reference, kind);
      // A deeper stage is only ever shown above the price when no band for it exists below.
      if (current && s.level > current.level && s.relation === "at-or-above")
        assert.ok(!zones.ranges.some((x) => x.level === s.level && x.high <= zones.reference), kind);
    }
  }
  assert.ok(scanned >= 12, `only ${scanned} scans produced zones`);
});

test("portfolio range and session move hold on 120 random baskets mixing every market shape", () => {
  const r = rng(77);
  let available = 0;
  for (let n = 0; n < 120; n++) {
    const size = 1 + Math.floor(r() * 40);
    const members = Array.from({ length: size }, () => market[Math.floor(r() * market.length)]);
    const positions = members.map(({ research }, i) => ({ id: String(i), symbol: research.company.symbol, quantity: r() < 0.03 ? 0 : 0.001 + r() * 5000, cost: 1, assetType: research.company.assetType }));
    positions.push({ id: "cash", symbol: "USD", quantity: 5000, cost: 1, assetType: "cash" });
    const quotes = Object.fromEntries(members.map(({ research }) => [research.company.symbol, { quote: research.quote }]));
    const history = Object.fromEntries(members.filter(() => r() > 0.05).map(({ research }) => [research.company.symbol, { candles: research.history.slice(-(60 + Math.floor(r() * 200))), source: "synthetic" }]));
    const range = portfolioRange(positions, quotes, history, "2026-11-07");
    if (range.available) {
      available++;
      assert.ok(range.cases[0].value <= range.cases[1].value && range.cases[1].value <= range.cases[2].value);
      assert.ok(range.cases.every((c) => good(c.value)) && good(range.reference));
      assert.ok(range.coverage > 0 && range.coverage <= 100 + 1e-9);
      assert.ok(Number.isFinite(range.volatility) && range.volatility >= 0 && range.drawdown >= 0 && range.drawdown < 100);
      assert.ok(Math.abs(range.drivers.reduce((a, d) => a + d.weight, 0) - 100) < 1e-6);
      if (range.volatility > 1e-9) assert.ok(Math.abs(range.drivers.reduce((a, d) => a + d.riskShare, 0) - 100) < 1e-4);
      assert.equal(range.included.filter((s) => range.excluded.includes(s)).length, 0);
      assert.ok(range.samples >= 40);
    } else assert.ok(range.reason.length > 20);
    const day = portfolioDay(positions, quotes, Date.parse("2026-11-07T00:00:00Z"));
    assert.ok(day.covered <= day.priced && day.priced <= day.holdings);
    assert.ok(day.coveredValue <= day.value + 1e-6);
    assert.equal(day.move === null, day.covered === 0);
    if (day.move !== null) assert.ok(Number.isFinite(day.move) && Number.isFinite(day.movePct));
    assert.ok(day.gainers.every((m) => m.move > 0) && day.decliners.every((m) => m.move < 0));
  }
  assert.ok(available >= 60, `only ${available} baskets produced a range`);
});

test("the three new views render for every market shape without leaking NaN, Infinity or undefined", () => {
  const ScenarioLenses = component("components/ScenarioLenses.tsx", {
    "@/lib/auryn-decision": decision, "@/lib/outlook": outlook, "@/lib/scenario-lenses": lensLib, "@/lib/format": format,
  });
  const PortfolioRange = component("components/PortfolioRange.tsx", { "@/lib/format": format });
  const PortfolioDay = component("components/PortfolioDay.tsx", {
    "@/lib/portfolio-day": dayLib, "@/lib/format": format, "@/lib/approved-workspace": { researchLink: (s, p) => `${p}/research/${s}` },
  });
  let rendered = 0;
  for (const kind of ARCHETYPES)
    for (const { research } of market.filter((m) => m.kind === kind).slice(0, 4)) {
      const html = renderToStaticMarkup(React.createElement(ScenarioLenses, { research }));
      clean(html, `${kind} lenses`);
      if (html) {
        rendered++;
        assert.match(html, /Scenario cross-check/);
        assert.match(html, /never averaged together/);
      }
      const positions = [{ id: "1", symbol: research.company.symbol, quantity: 12.5, cost: 1, assetType: research.company.assetType }];
      const quotes = { [research.company.symbol]: { quote: research.quote } };
      clean(renderToStaticMarkup(React.createElement(PortfolioRange, { range: portfolioRange(positions, quotes, { [research.company.symbol]: { candles: research.history, source: "s" } }, "2026-11-07") })), `${kind} range`);
      clean(renderToStaticMarkup(React.createElement(PortfolioDay, { positions, quotes, prefix: "", now: Date.parse("2026-11-07T00:00:00Z") })), `${kind} day`);
    }
  assert.ok(rendered >= 70, `only ${rendered} cross-checks rendered`);
});

test("sub-dollar and very large prices stay distinguishable when formatted", () => {
  assert.equal(format.priceAmount(0.00001234), "$0.00001234");
  assert.equal(format.priceAmount(0.0712), "$0.0712");
  assert.equal(format.priceAmount(0.5), "$0.50");
  assert.equal(format.priceAmount(21.41), "$21.41");
  assert.equal(format.priceAmount(74846.3), "$74,846.30");
  assert.equal(format.priceAmount(612345.6), "$612.3K");
  assert.equal(format.priceAmount(NaN), "—");
  assert.notEqual(format.priceAmount(0.00420), format.priceAmount(0.00431));
});
