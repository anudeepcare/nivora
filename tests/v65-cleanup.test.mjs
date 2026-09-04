
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("active stock hero no longer defines a local MetricInfo implementation",()=>{
 const h=fs.readFileSync("components/InvestorDecisionHero.tsx","utf8");
 assert.doesNotMatch(h,/function MetricInfo\(/);
});
test("active StockClient no longer defines separate Help tooltip implementation",()=>{
 const s=fs.readFileSync("components/StockClient.tsx","utf8");
 assert.doesNotMatch(s,/function Help\(/);
});
