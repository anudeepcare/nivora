import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8");
test("fast quote imports canonical authority max age",()=>{assert.match(a,/export const marketPriceMaxAgeSeconds/);assert.match(f,/marketPriceMaxAgeSeconds/);});
test("fast quote no longer has divergent 900s extended trade age",()=>{assert.doesNotMatch(f,/PRE_MARKET"\|\|session==="AFTER_HOURS"\?900/);});
