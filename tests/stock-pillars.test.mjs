import test from "node:test";
import assert from "node:assert/strict";
import { stockPillars } from "../lib/stock-pillars.ts";
import { aurynDecision } from "../lib/auryn-decision.ts";
import { demoData } from "./fixtures/demo.ts";
import { universe } from "./helpers/market-universe.mjs";

const run = (r) => stockPillars(r, aurynDecision(r, { now: Date.parse(r.priceObservedAt ?? r.retrievedAt) }));
test("six plain questions are answered from measured evidence for the demo companies", () => {
  for (const r of Object.values(demoData.research)) {
    const v = run(r);
    if (r.company.assetType !== "stock") { assert.equal(v, null); continue; }
    assert.deepEqual(v.pillars.map((p) => p.id), ["growth", "profit", "funding", "price", "timing", "risk"]);
    assert.equal(v.supportive + v.caution + v.unknown + v.pillars.filter((p) => p.status === "mixed").length, 6);
    for (const p of v.pillars) assert.doesNotMatch(p.answer + p.why + v.summary, /NaN|undefined|Infinity|—%/, r.company.symbol);
  }
  const msft = run(demoData.research.MSFT);
  assert.ok(msft.cases.bear <= msft.cases.base && msft.cases.base <= msft.cases.bull);
  assert.equal(msft.cases.position, msft.cases.price > msft.cases.bull ? "above-bull" : msft.cases.price < msft.cases.bear ? "below-bear" : "inside");
  assert.equal(msft.pillars[1].status, "supportive");
  assert.equal(msft.pillars[2].answer, "Funds itself");
});
test("holds for every market shape and reports missing evidence as not measured, never as a negative", () => {
  for (const { kind, research } of universe(4)) {
    const v = run(research);
    if (research.company.assetType !== "stock") { assert.equal(v, null, kind); continue; }
    assert.equal(v.pillars.length, 6, kind);
    for (const p of v.pillars) {
      assert.ok(["supportive", "mixed", "caution", "unknown"].includes(p.status), kind);
      assert.doesNotMatch(p.answer + p.why, /NaN|undefined|Infinity/, kind);
      if (p.status === "unknown") assert.equal(p.answer, "Not measured", kind);
    }
  }
  const bare = { ...universe(1)[0].research, facts: [], evidence: undefined, history: [] };
  const v = run(bare);
  assert.equal(v.unknown, 6);
  assert.equal(v.cases, null);
  assert.equal(v.exitWatch, null);
});
test("sell-side prompts appear when the price is above the bull case or the whole business case is weak", () => {
  const all = Object.values(demoData.research).filter((r) => r.company.assetType === "stock").map(run);
  for (const v of all) {
    const above = v.cases?.position === "above-bull";
    if (above) assert.equal(v.exitWatch?.level, "trim");
    if (v.exitWatch?.level === "trim") assert.ok(above);
    if (v.exitWatch) assert.match(v.exitWatch.text, /watch:|Size check:/);
  }
  assert.ok(all.some((v) => v.exitWatch?.level === "trim"));
});

import { evidenceOdds, businessState } from "../lib/evidence-odds.ts";
import { EVIDENCE_TABLE } from "../lib/evidence-table.ts";
test("business state follows the study's stated check and never guesses from missing figures", () => {
  assert.equal(businessState({ operatingMargin: 20, fcf: 5, dilution: 2, revenueGrowth: 10 }), "pass");
  assert.equal(businessState({ operatingMargin: 20, fcf: 5, dilution: 14, revenueGrowth: 10 }), "mixed");
  assert.equal(businessState({ operatingMargin: 20, fcf: 5, dilution: null, revenueGrowth: -9 }), "mixed");
  assert.equal(businessState({ operatingMargin: -20, fcf: -5, dilution: null, revenueGrowth: 90 }), "fail");
  assert.equal(businessState({ operatingMargin: -20, fcf: 5, dilution: null, revenueGrowth: null }), "mixed");
  assert.equal(businessState({ operatingMargin: null, fcf: 5, dilution: null, revenueGrowth: null }), null);
});
test("each stock is matched to the measured record of its own state, with the deep-fall and near-high cases called out", () => {
  const bars = (f) => Array.from({ length: 300 }, (_, i) => ({ time: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), open: f(i), high: f(i), low: f(i), close: f(i), volume: 1 }));
  const r = (f) => ({ company: { assetType: "stock" }, history: bars(f) });
  const pass = { operatingMargin: 20, fcf: 5, dilution: 1, revenueGrowth: 8 }, fail = { operatingMargin: -30, fcf: -5, dilution: 1, revenueGrowth: 8 };
  const up = evidenceOdds(r((i) => 100 + i), pass);
  assert.deepEqual([up.business, up.trend, up.grade], ["pass", "up", "favourable"]);
  assert.equal(up.cell, EVIDENCE_TABLE["pass:up"]);
  assert.equal(up.modifier.cell, EVIDENCE_TABLE["pass:nearHigh"]);
  const deep = evidenceOdds(r((i) => (i < 200 ? 100 : 100 - (i - 200) * 0.6)), pass);
  assert.equal(deep.trend, "down");
  assert.equal(deep.modifier.cell, EVIDENCE_TABLE["pass:deep"]);
  assert.equal(deep.grade, "neutral");
  const bad = evidenceOdds(r((i) => 100 + i), fail);
  assert.deepEqual([bad.business, bad.grade], ["fail", "unfavourable"]);
  assert.match(bad.detail, /higher a year later 40% of the time/);
  assert.equal(evidenceOdds({ company: { assetType: "stock" }, history: bars((i) => 1 + i).slice(0, 150) }, pass), null);
  assert.equal(evidenceOdds({ company: { assetType: "crypto" }, history: bars((i) => 1 + i) }, pass), null);
  for (const c of Object.values(EVIDENCE_TABLE)) assert.ok(c.n >= 2000 && c.win > 0 && c.win < 100 && c.bad < 0);
  // The study's central finding is encoded, not assumed.
  assert.ok(EVIDENCE_TABLE["pass:up"].win > EVIDENCE_TABLE["pass:deep"].win && EVIDENCE_TABLE["pass:deep"].win > EVIDENCE_TABLE["fail:up"].win);
});
