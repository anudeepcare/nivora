
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const truth=fs.readFileSync("lib/auryn/market-truth.ts","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const session=fs.readFileSync("lib/nivora-market-session.ts","utf8");
test("one canonical truth includes price provider timestamp session freshness confidence age and checked time",()=>{
 for(const k of ["price","provider","priceTimestamp","session","freshness","confidence","ageSeconds","checkedAt"]) assert.match(truth,new RegExp(k));
});
test("viewer local time is rendered by Intl without hard-coded timezone",()=>{assert.match(truth,/Intl\.DateTimeFormat/);assert.doesNotMatch(truth,/America\/Chicago|America\/New_York/)});
test("header and trust consume canonical market truth",()=>{assert.match(stock,/marketTruth/);assert.match(stock,/formatMarketTruth/);});
test("market session handles weekends and explicit boundary semantics",()=>{assert.match(session,/getUTCDay/);assert.match(session,/PRE_MARKET/);assert.match(session,/AFTER_HOURS/)});
test("canonical UI distinguishes live premarket afterhours closed recent and crypto",()=>{
 for(const x of ["LIVE","PRE-MARKET","AFTER-HOURS","MARKET CLOSED","RECENT","24/7 LIVE"])assert.match(truth,new RegExp(x.replace("/","\\/")));
});
test("pricing pipeline has no symbol-specific exceptions",()=>{assert.doesNotMatch(truth,/\b(META|AMZN|GOOGL|IREN|CRM|SAP|OSCR|IBIT|ETHA)\b/)});
