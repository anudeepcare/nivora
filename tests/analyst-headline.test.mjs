import test from "node:test";
import assert from "node:assert/strict";
import { stockPillars } from "../lib/stock-pillars.ts";
import { aurynDecision } from "../lib/auryn-decision.ts";
import { demoData } from "./fixtures/demo.ts";
function input() {
  const r = structuredClone(demoData.research.MSFT);
  r.company.exchange = "NASDAQ";
  r.retrievedAt = r.priceObservedAt = "2026-11-12T01:00:00Z";
  r.evidence = { ...(r.evidence ?? {}), updatedAt: "2026-11-11" };
  r.evidence.consensus = { low: 23, target: 56.69, high: 139 };
  r.history = [
    {
      time: "2026-11-11",
      open: 20.84,
      high: 20.84,
      low: 20.84,
      close: 20.84,
      volume: 100,
    },
  ];
  r.quote = {
    ...r.quote,
    price: 21,
    asOf: "2026-11-11T23:00:00Z",
    stale: false,
  };
  return r;
}
function run(r) {
  const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  d.valuation = {
    basis: "cash-flow",
    label: "Cash-flow valuation",
    bear: 5,
    base: 10,
    bull: 15,
  };
  return stockPillars(r, d);
}
test("headline cases use supplied analyst targets even when an intrinsic model qualifies", () => {
  const c = run(input()).cases;
  assert.ok(c);
  assert.deepEqual([c.bear, c.base, c.bull, c.price], [23, 56.69, 139, 20.84]);
  assert.match(c.source, /Analyst/);
});
test("missing analyst low/high uses a separately named qualifying AURYN model", () => {
  const r = input();
  r.evidence.consensus = { target: 56.69 };
  const c=run(r).cases; assert.ok(c); assert.deepEqual([c.bear,c.base,c.bull],[5,10,15]); assert.match(c.source,/AURYN/); assert.doesNotMatch(c.source,/Analyst/);
});
test("stale analyst targets cannot contaminate a separately named model", () => {
  const r = input();
  r.evidence.updatedAt = "2025-01-01";
  const c=run(r).cases; assert.ok(c); assert.match(c.source,/AURYN/);
});

test("missing fundamental evidence never becomes a fabricated valuation range",()=>{
 const r=input();r.facts=[];r.evidence={updatedAt:"2026-11-11",consensus:{target:56.69},estimates:[]};
 const d=aurynDecision(r,{now:Date.parse(r.retrievedAt)});d.valuation=null;
 assert.equal(stockPillars(r,d).cases,null);
});
