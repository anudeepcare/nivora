import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("last available uses valid QuoteFreshness enum",()=>{assert.doesNotMatch(f,/freshness:"RECENT"/);assert.match(f,/freshness:"LAST_TRADE"/);});
test("LAST_AVAILABLE remains separate display state",()=>{assert.match(f,/displayState:"LAST_AVAILABLE"/);});
