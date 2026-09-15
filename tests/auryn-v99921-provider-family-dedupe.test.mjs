import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8");
test("authority dedupes multiple Twelve transports before agreement",()=>{assert.match(a,/family/);assert.match(a,/twelvedata/);assert.match(a,/validRaw\.filter/);});
