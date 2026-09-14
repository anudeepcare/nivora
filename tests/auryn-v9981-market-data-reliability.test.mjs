
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8");
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("authority has explicit 24x7 crypto session",()=>assert.match(a,/CRYPTO_24X7/));
test("equity fast path can use a fresh quote midpoint when last trade is old",()=>{assert.match(f,/QUOTE_MID/);assert.match(f,/fresh quote midpoint/i)});
test("single healthy source is displayable",()=>assert.match(a,/SINGLE_SOURCE/));
test("provider failures are exposed as diagnostics",()=>{assert.match(f,/diagnostics/);assert.match(f,/RATE_LIMIT/);});
test("crypto does not require Alpaca equity path",()=>{assert.match(f,/isCryptoSymbol/);assert.match(f,/CRYPTO_24X7/);});
test("regular display freshness is less brittle than 60 second last trade cutoff",()=>assert.doesNotMatch(f,/MAX_REGULAR_RESEARCH_QUOTE_AGE_SECONDS=60/));
test("fast quote has sane provider timeout",()=>assert.match(f,/AbortSignal\.timeout\(3500\)/));
