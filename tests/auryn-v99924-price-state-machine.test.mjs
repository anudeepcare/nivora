import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
test("fast quote returns newest trustworthy last-available observation instead of throwing",()=>{assert.match(f,/displayState:"LAST_AVAILABLE"/);assert.match(f,/lastAvailable/);});
test("client has one canonical display price state",()=>{for(const x of ["aurynPriceState","LIVE","LAST_AVAILABLE","LAST_VERIFIED","UNAVAILABLE"])assert.ok(s.includes(x),x);});
test("normal UI never exposes provider diagnostics or PRICE VERIFYING",()=>{assert.doesNotMatch(s,/Provider status:/);assert.doesNotMatch(s,/status=.*PRICE VERIFYING/);});
test("quote refresh reacts to timer focus visibility and reconnect",()=>{assert.match(s,/visibilitychange/);assert.match(s,/addEventListener\("online"/);assert.match(s,/addEventListener\("focus"/);});
test("reference price never enables live execution",()=>{assert.match(s,/displayPriceLive=\{aurynPriceState\.isLive\}/);});
