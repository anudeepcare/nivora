import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8");
test("technicalEvidence does not read nonexistent marketLab relativeStrengthPct",()=>{const call=s.match(/<AurynResearchOverviewV2[\s\S]*?\/>/)?.[0]||"";assert.doesNotMatch(call,/marketLab\?\.relativeStrengthPct/);assert.match(call,/technicalState\.trend/);});
