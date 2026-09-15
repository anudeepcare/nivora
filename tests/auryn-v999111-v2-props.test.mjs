import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const v2=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
test("StockClient only passes props accepted by Overview V2",()=>{const call=stock.match(/<AurynResearchOverviewV2[\s\S]*?\/>/)?.[0]||"";for(const p of ["scenario="])assert.doesNotMatch(call,new RegExp(p));assert.match(v2,/fundamentalScenario\?:any/);});
