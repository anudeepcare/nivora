import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("fast quote consumes Twelve split extended-hours fields",()=>{for(const x of ["extended_price","extended_timestamp","normalizeTwelveQuote"])assert.match(f,new RegExp(x));});
test("Twelve candidate price and timestamp come from normalized quote",()=>{assert.match(f,/normalized\.price/);assert.match(f,/normalized\.providerTimestamp/);assert.match(f,/normalized\.isExtendedHours/);});
test("quote API exposes provider diagnostics on success",()=>{const r=fs.readFileSync("app/api/quote/[symbol]/route.ts","utf8");assert.match(r,/diagnostics/);});
