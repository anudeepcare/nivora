import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),chart=fs.readFileSync("app/api/chart/[symbol]/route.ts","utf8");
test("Twelve quote explicitly requests prepost extended-hours data",()=>{assert.match(f,/quote\?symbol=.*prepost=true/);});
test("intraday chart explicitly requests prepost extended-hours data",()=>{assert.match(chart,/prepost=true/);});
test("extended quote diagnostics identify Twelve normalized extended state",()=>{assert.match(f,/extendedPrice/);assert.match(f,/extendedTimestamp/);});
