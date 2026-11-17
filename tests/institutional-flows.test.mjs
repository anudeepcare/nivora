import test from "node:test";
import assert from "node:assert/strict";
import { institutionalFlowsView } from "../lib/institutional-flows-view.ts";
import fs from "node:fs";
test("flow UI contract preserves zero/negative shares and pending coverage, removes scores and bounds rows", () => {
  const v = institutionalFlowsView({
    reportDate: "2026-09-30",
    isPending: true,
    filerCount: 0,
    baselineFilerCount: 100,
    score: 88,
    inflows: Array.from({ length: 30 }, () => ({
      ticker: "APP",
      netSharesChange: 0,
      sentiment: "bullish",
    })),
    outflows: [{ ticker: "MSFT", netSharesChange: -4 }],
  });
  assert.equal(v.inflows.length, 20);
  assert.equal(v.filerCount, 0);
  assert.equal(v.inflows[0].netSharesChange, 0);
  assert.equal(v.outflows[0].netSharesChange, -4);
  assert.ok(!JSON.stringify(v).includes("sentiment"));
  assert.ok(!JSON.stringify(v).includes("score"));
});
test("discovery flow request remains lazy and authenticated with plan quota", () => {
  const ui = fs.readFileSync("components/InstitutionalFlows.tsx", "utf8");
  assert.match(ui, /open \? "institutional-flows" : null/);
  assert.match(ui, /Reported quarter-over-quarter share changes/);
  const route = fs.readFileSync("app/api/institutional-flows/route.ts", "utf8");
  assert.match(route, /account\(request, \{ market: true \}\)/);
  assert.match(route, /reserveAccess/);
  assert.match(route, /features.advanced/);
  assert.match(route, /institutionalFlowsView\(result.data\)/);
});
