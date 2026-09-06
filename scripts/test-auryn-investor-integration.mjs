import fs from"node:fs";import assert from"node:assert/strict";const s=fs.readFileSync("lib/nivora-investor.ts","utf8");
assert.match(s,/buildCanonicalFactors/);assert.match(s,/canonicalFactors\.business/);assert.match(s,/assetClass==="ETF"/);
assert.doesNotMatch(s,/const base=num\(company\?\.fundamentalSignal\?\.score,50\)/);
assert.match(s,/canonicalFactors\.coverage/);
console.log("investor canonical integration PASS");
