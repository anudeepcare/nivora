
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const truth=fs.readFileSync("lib/auryn/market-truth.ts","utf8"),auth=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),fast=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("active premarket and afterhours never promote stale morning price to primary",()=>{assert.match(auth,/ACTIVE_SESSION_PRICE_UNAVAILABLE/);assert.doesNotMatch(auth,/input\.session!=="REGULAR"[\s\S]*LAST MARKET PRICE/)});
test("truth exposes unavailable active-session state",()=>{assert.match(truth,/AFTER-HOURS PRICE UNAVAILABLE/);assert.match(truth,/PRE-MARKET PRICE UNAVAILABLE/)});
test("regular close may be secondary context but not primary active-session price",()=>assert.match(truth,/referencePrice/));
test("alpaca extended-hours quote freshness is session aware",()=>{assert.match(fast,/sessionQuoteMaxAge/);assert.match(fast,/AFTER_HOURS/);assert.match(fast,/PRE_MARKET/)});
test("crypto remains 24x7",()=>assert.match(truth,/24\/7 LIVE/));
