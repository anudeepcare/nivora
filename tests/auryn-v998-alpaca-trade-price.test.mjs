
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Alpaca display price uses a trade-first normalizer separate from execution quote semantics",()=>{
 const e=fs.readFileSync("lib/nivora-execution-quote.ts","utf8");
 const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
 assert.match(e,/normalizeAlpacaMarketPrice/);
 assert.match(e,/const price=trade\?\?quoteMid\?\?0/);
 assert.match(f,/normalizeAlpacaMarketPrice/);
});
test("fast quote uses market price authority",()=>{
 const s=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
 assert.match(s,/selectMarketDisplayQuote/);
});
test("StockClient consumes API authority label rather than recomputing provider labels",()=>{
 const s=fs.readFileSync("components/StockClient.tsx","utf8");
 assert.match(s,/displayAuthority/);
 assert.match(s,/stableDisplayQuote\?\.label/);
});
