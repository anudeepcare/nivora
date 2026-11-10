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
    if (v.exitWatch) assert.match(v.exitWatch.text, /watch:/);
  }
  assert.ok(all.some((v) => v.exitWatch?.level === "trim"));
});
