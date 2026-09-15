import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
test("StockClient loads independent 5Y bars for long-term roadmap",()=>{assert.match(s,/longTermBars/);assert.match(s,/\/api\/chart\/.*range=5Y/);});
test("Overview builds long-term roadmap from longTermCandles",()=>{assert.match(v,/longTermCandles/);assert.match(v,/buildLongTermRoadmap\(longTermCandles/);});
