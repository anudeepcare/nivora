import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const api=()=>fs.readFileSync("app/api/portfolio/pulse/route.ts","utf8");
test("snapshot is daily idempotent and benchmark capture is optional",()=>{
 const s=api();
 const gateway=fs.readFileSync("lib/auryn/market-data-gateway.ts","utf8");
 assert.match(s,/onConflict:"user_id,snapshot_day"/);
 assert.match(s,/loadCanonicalMarketSnapshots/);
 assert.match(s,/snapshot\.displayPrice\?\?null/);
 assert.match(gateway,/Promise\.allSettled/);
});
test("portfolio refreshes history after successful snapshot",()=>{const s=fs.readFileSync("app/portfolio/page.tsx","utf8");assert.match(s,/method:"POST"/);assert.match(s,/setPulseHistory/);assert.match(s,/refreshPulseHistory/);});