import { modelCoverage } from "../lib/research-depth.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  if (!fs.existsSync("lib/outlook.ts")) return {};
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync("lib/outlook.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, () => ({ modelCoverage }));
  return exports;
}
function research() {
  return {
    company: { symbol: "CRM", assetType: "stock", currency: "USD" },
    facts: [],
    quote: { price: 100, currency: "USD", stale: false, asOf: "2026-10-16T20:00:00Z" },
    retrievedAt: "2026-10-17T12:00:00Z",
    evidence: {
      updatedAt: "2026-10-16",
      reportingCurrency: "USD",
      profile: { sector: "Technology", industry: "Software" },
      multiples: { ForwardPE: 20 },
      estimates: [
        {
          date: "2029-10-17",
          period: "FY2029",
          frequency: "annual",
          currency: "USD",
          eps: 8,
          epsLow: 6,
          epsHigh: 10,
          analysts: 15,
        },
      ],
    },
  };
}

test("a consensus fallback never revives an old target and always carries its observation date", () => {
  const { consensusOutlook } = load();
  assert.equal(typeof consensusOutlook, "function");
  const input = research();
  input.evidence.consensus = { target: 150 };
  assert.equal(consensusOutlook(input).asOf, "2026-10-16");
  input.evidence.updatedAt = "2023-01-01";
  assert.equal(consensusOutlook(input), null);
  input.evidence.updatedAt = "2026-10-16";
  input.quote.stale = true;
  assert.equal(consensusOutlook(input).target, 150);
});
test("outlook prices use actual forecast EPS, disclosed multiple sensitivity, and a common horizon", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  const r = researchOutlook(research());
  assert.equal(r.available, true);
  assert.equal(r.cases[0].target, 96);
  assert.equal(r.cases[1].target, 160);
  assert.equal(r.cases[2].target, 240);
  assert(Math.abs(r.cases[1].change - 60) < 1e-10);
  assert(Math.abs((1 + r.cases[1].annual / 100) ** r.years - 1.6) < 1e-10);
  assert.equal(r.period, "FY2029");
  assert.equal(r.cases[0].multiple, 16);
});
test("a missing EPS range cannot become fabricated bear and bull targets", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  const input = research();
  input.evidence.estimates[0].epsLow = null;
  const r = researchOutlook(input);
  assert.equal(r.available, false);
  assert.match(r.reason, /range/i);
});
test("crypto, foreign listings, stale quotes and mismatched currency withhold corporate targets", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  for (const change of [
    (r) => (r.company.assetType = "crypto"),
    (r) => (r.company.foreignListing = true),
    (r) => (r.quote.stale = true),
    (r) => (r.evidence.estimates[0].currency = "EUR"),
  ]) {
    const input = research();
    change(input);
    assert.equal(researchOutlook(input).available, false);
  }
});
test("quarterly, dated, nonpositive or inverted forecasts never produce a valid outlook", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  for (const change of [
    (r) => (r.evidence.estimates[0].frequency = "quarterly"),
    (r) => (r.evidence.updatedAt = "2023-01-01"),
    (r) => (r.evidence.estimates[0].epsLow = -1),
    (r) => (r.evidence.estimates[0].epsLow = 12),
  ]) {
    const input = research();
    change(input);
    assert.equal(researchOutlook(input).available, false);
  }
});

test("healthcare-plan insurers cannot bypass the same sector gate used by the decision guide", () => {
  const { researchOutlook } = load();
  const input = research();
  input.company.symbol = "OSCR";
  input.evidence.profile = {
    sector: "Healthcare",
    industry: "Healthcare Plans",
  };
  input.evidence.multiples.ForwardPE = 700;
  const result = researchOutlook(input);
  assert.equal(result.available, false);
  assert.match(result.reason, /sector-specific/i);
});

test("outlook rejects a fiscal label that contradicts its underlying forecast date", () => {
  const input = research();
  input.evidence.estimates[0].period = "FY2035";
  const result = load().researchOutlook(input);
  assert.equal(result.available, false);
  assert.match(result.reason, /period|date/i);
});

test("a bank can show a labelled earnings sensitivity without applying an operating-cash-flow valuation", () => {
  const r = research();
  r.company.symbol = "NU";
  r.evidence.profile = {
    sector: "Financial Services",
    industry: "Banks - Diversified",
  };
  const result = load().researchOutlook(r);
  assert.equal(result.available, true);
  assert.equal(result.cases[1].target, 160);
});

test("consensus comparison calculates the gap without calling it fair value or inventing high/low targets", () => {
  const input = research();
  input.evidence.consensus = { target: 150 };
  const result = load().consensusOutlook(input);
  assert.equal(result.change, 50);
  assert.equal(result.target, 150);
  assert.equal(result.high, undefined);
  assert.equal(result.low, undefined);
});

test('a malformed nearer fiscal label cannot hide another complete eligible EPS forecast',()=>{
 const r=research();const good=r.evidence.estimates[0];
 r.evidence.estimates=[{...good,period:'FY2035'}, {...good,date:'2028-12-31',period:'FY2028'}];
 const result=load().researchOutlook(r);assert.equal(result.available,true);assert.equal(result.period,'FY2028');
});

test('analyst consensus is listing-currency opinion and does not require a share reconciliation',async()=>{
 const fs=await import('node:fs/promises');
 const r=JSON.parse(await fs.readFile(new URL('./fixtures/iren-observed-20261019.json',import.meta.url),'utf8'));
 const {consensusOutlook}=await import('../lib/outlook.ts');
 assert.equal(consensusOutlook(r).target,77.8056);
 r.company.foreignListing=true;assert.equal(consensusOutlook(r).target,77.8056);
 r.quote.currency='EUR';assert.equal(consensusOutlook(r),null);
});

test('quote freshness transitions do not remove a dated analyst target',()=>{
 const r=research();r.evidence.consensus={target:150};r.quote.asOf='2026-10-16T20:00:00Z';
 const {consensusOutlook}=load();
 const live=consensusOutlook(r);r.quote.stale=true;const older=consensusOutlook(r);
 assert.equal(older.target,live.target);assert.equal(older.referenceStatus,'older');assert.equal(older.change,50);
 r.quote.price=null;const missing=consensusOutlook(r);assert.equal(missing.target,150);assert.equal(missing.change,null);assert.equal(missing.referenceStatus,'unavailable');
 r.quote.price=100;r.quote.asOf='2026-01-01';assert.equal(consensusOutlook(r).change,null);
});
