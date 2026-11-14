import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
import * as outlook from "../lib/outlook.ts";
import * as format from "../lib/format.ts";
import * as stockPillars from "../lib/stock-pillars.ts";
import * as analysis from "../lib/analysis.ts";
import * as decisions from "../lib/auryn-decision.ts";
import * as icons from "lucide-react";
import { demoData } from "./fixtures/demo.ts";

const input = () => ({
  company: { symbol: "TEST", assetType: "stock", currency: "USD" },
  quote: {
    price: 105,
    currency: "USD",
    asOf: "2026-11-13T14:00:00Z",
    stale: false,
  },
  retrievedAt: "2026-11-13T14:00:00Z",
  history: [
    {
      time: "2026-11-12",
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 10,
    },
  ],
  evidence: {
    source: "EODHD",
    updatedAt: "2026-11-12",
    consensus: { target: 120 },
  },
});
const raw = () => ({
  General: {
    Code: "TEST",
    CurrencyCode: "USD",
    Exchange: "NASDAQ",
    UpdatedAt: "2026-11-12",
  },
  Highlights: { WallStreetTargetPrice: 120 },
});

test("documented Highlights consensus survives a missing AnalystRatings target without invented bounds", () => {
  const e = normalizeEodFundamentals("TEST", raw(), "2026-11-13").evidence;
  assert.equal(e.consensus.target, 120);
  assert.equal(
    e.consensus.targetSourceField,
    "Highlights.WallStreetTargetPrice",
  );
  assert.equal(e.consensus.currency, "USD");
  assert.equal(e.consensus.low, null);
  assert.equal(e.consensus.high, null);
});
test("AnalystRatings stays authoritative and invalid bounds are never grafted onto a fallback mean", () => {
  const r = raw();
  r.AnalystRatings = {
    TargetPrice: 130,
    TargetPriceLow: 110,
    TargetPriceHigh: 150,
  };
  let c = normalizeEodFundamentals("TEST", r, "2026-11-13").evidence.consensus;
  assert.equal(c.target, 130);
  assert.equal(c.targetSourceField, "AnalystRatings.TargetPrice");
  r.AnalystRatings.TargetPrice = 0;
  c = normalizeEodFundamentals("TEST", r, "2026-11-13").evidence.consensus;
  assert.equal(c.target, 120);
  assert.equal(c.low, null);
  assert.equal(c.high, null);
});
test("genuine equal low consensus high targets remain visible", () => {
  const r = input();
  r.evidence.consensus = { low: 120, target: 120, high: 120 };
  const c = outlook.consensusOutlook(r);
  assert.equal(c.low, 120);
  assert.equal(c.high, 120);
  assert.equal(c.rangeStatus, "complete");
});
test("wrong target currency is not compared as a USD target", () => {
  const r = input();
  r.evidence.consensus.currency = "EUR";
  assert.equal(outlook.consensusOutlook(r), null);
});

function component(file, name = "default") {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const dependencies = {
    "react/jsx-runtime": jsx,
    react: React,
    "lucide-react": icons,
    "@/lib/stock-pillars": stockPillars,
    "@/lib/analysis": analysis,
    "@/lib/auryn-decision": decisions,
    "./StockPillars.module.css": {},
    "./ResearchBrief.module.css": {},
    "@/lib/outlook": outlook,
    "@/lib/format": format,
    "./AnalystTargets.module.css": { root: "targets" },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
    mod,
    mod.exports,
  );
  return mod.exports[name];
}
const Targets = component("components/AnalystTargets.tsx");
const Ratings = component("components/AnalystRatings.tsx");
const render = (view, r) =>
  renderToStaticMarkup(React.createElement(view, { research: r }));
test("consensus-only targets name the settled-close denominator and explain missing bounds", () => {
  const html = render(Targets, input());
  assert.match(html, /Versus settled close/);
  assert.match(html, /Low and high targets are not supplied/);
  assert.match(html, /EODHD/);
  assert.doesNotMatch(html, /Versus current price/);
});
test("rating panel does not deny a supplied target range or call a provider update a retrieval date", () => {
  const r = input();
  r.evidence.consensus = { target: 120, low: 110, high: 150 };
  const html = render(Ratings, r);
  assert.doesNotMatch(html, /target ranges are not/);
  assert.doesNotMatch(html, /Dataset retrieved/);
  assert.match(html, /Dataset updated/);
});

test("private target ranges show their own count and refresh while recommendations stay EOD-sourced", () => {
  const r = input();
  r.analystTargets = {
    symbol: "TEST",
    currency: "USD",
    source: "SentiSense",
    sourceField: "consensus.targetMean",
    timestampBasis: "dataset-refresh",
    updatedAt: "2026-11-13T12:00:00Z",
    low: 80,
    target: 140,
    high: 200,
    analysts: 19,
  };
  r.evidence.consensus = { target: 120, rating: 3, strongBuy: 5, buy: 3 };
  const targets = render(Targets, r),
    ratings = render(Ratings, r);
  assert.match(targets, /19 analysts/);
  assert.match(targets, /SentiSense/);
  assert.match(targets, /Nov 13, 2026/);
  assert.match(targets, /individual target revision dates/);
  assert.match(ratings, /Reported recommendations<\/span><strong>8<\/strong>/);
  assert.match(ratings, /Ratings: EODHD/);
  assert.match(ratings, /SentiSense/);
  assert.doesNotMatch(
    ratings,
    /Reported recommendations<\/span><strong>19<\/strong>/,
  );
  r.analystTargets.analysts = null;
  assert.doesNotMatch(render(Targets, r), /0 analysts|null analysts/);
});

test("Overview range and freshness captions distinguish selected targets from EOD estimates and ratings", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.retrievedAt = r.priceObservedAt = "2026-11-14T00:00:00Z";
  r.evidence = {
    ...(r.evidence ?? {}),
    source: "EODHD",
    updatedAt: "2026-11-12",
    consensus: { target: 40 },
  };
  r.analystTargets = {
    symbol: r.company.symbol,
    currency: "USD",
    source: "SentiSense",
    sourceField: "consensus.targetMean",
    timestampBasis: "dataset-refresh",
    updatedAt: "2026-11-13T23:37:41Z",
    low: 23,
    target: 56.6874,
    high: 139,
    analysts: 19,
  };
  const now = Date.parse(r.retrievedAt),
    decision = decisions.aurynDecision(r, { now });
  const Pillars = component("components/StockPillars.tsx");
  const html = renderToStaticMarkup(
    React.createElement(Pillars, { research: r, decision, casesOnly: true }),
  );
  assert.match(html, /SentiSense/);
  assert.match(html, /2026-11-13/);
  assert.match(html, /Dataset updated/);
  const Freshness = component("components/ResearchBrief.tsx", "DataFreshness");
  const fresh = renderToStaticMarkup(
    React.createElement(Freshness, { research: r, now, decision }),
  );
  assert.match(fresh, /SentiSense targets/);
  assert.match(fresh, /Nov 13, 2026/);
  assert.match(fresh, /EODHD estimates\/ratings/);
  assert.match(fresh, /Nov 12, 2026/);
});
