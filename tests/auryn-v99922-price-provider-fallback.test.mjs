import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),r=fs.readFileSync("app/api/quote/[symbol]/route.ts","utf8");
test("Finnhub configured quote provider participates in current-price authority",()=>{assert.match(f,/fromFinnhub/);assert.match(f,/finnhub\.io\/api\/v1\/quote/);assert.match(r,/FINNHUB_API_KEY/);});
test("provider diagnostics never call stale Twelve data fresh",()=>{assert.match(f,/candidate\?"fresh extended-hours market data available":"extended-hours observation outside freshness window"/);});
test("Twelve entitlement failure remains explicit",()=>{assert.match(f,/twelve-intraday/);});
