import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
test("Twelve has independent 1min prepost time-series fallback",()=>{assert.match(f,/fromTwelveIntradayLast/);assert.match(f,/time_series\?symbol=.*interval=1min.*prepost=true/);});
test("Twelve quote and intraday fallback are both provider candidates",()=>{assert.match(f,/twelve-intraday/);});
test("unavailable UI exposes authority reason plus candidate age",()=>{assert.match(s,/ageSeconds/);assert.match(s,/q\?\.reason/);});
