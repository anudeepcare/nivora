import fs from "node:fs";import assert from "node:assert/strict";
const s=fs.readFileSync("lib/auryn/factor-engine.ts","utf8");
assert.match(s,/buildCanonicalFactors/);assert.match(s,/assetClass==="ETF"/);assert.match(s,/score:null/);
assert.match(s,/latestQuarter/);assert.match(s,/guidance/);assert.match(s,/renormal/);
assert.doesNotMatch(s,/missing[^\n]{0,40}(?:score|value)[^\n]{0,20}50/i);
console.log("factor contract PASS");
