import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("Twelve prepost quote explicitly requests supported intraday interval",()=>{assert.match(f,/quote\?symbol=.*interval=1min.*prepost=true/);});
test("Twelve extended candidate retains provider timestamp",()=>{assert.match(f,/normalized\.providerTimestamp/);});
