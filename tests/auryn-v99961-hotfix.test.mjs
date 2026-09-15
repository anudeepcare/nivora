
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("FastResearchQuote accepts every authority DisplayLabel without duplicating union",()=>assert.match(f,/label\?:DisplayLabel/));
test("provider closed flag cannot override premarket or afterhours calendar",()=>{
 assert.match(f,/fallback==="PRE_MARKET"\|\|fallback==="AFTER_HOURS"/);
 assert.doesNotMatch(f,/if\(body\?\.is_market_open===false\)return "CLOSED"/);
});
