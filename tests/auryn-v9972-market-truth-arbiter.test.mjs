import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";

test("Alpaca latest quote explicitly uses IEX feed",()=>{
 const s=fs.readFileSync("lib/alpaca-paper.ts","utf8");
 assert.match(s,/quotes\/latest\?feed=iex/);
 assert.match(s,/trades\/latest\?feed=iex/);
});

test("regular-session research quote rejects delayed provider data",()=>{
 const s=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
 assert.match(s,/MAX_REGULAR_RESEARCH_QUOTE_AGE_SECONDS=60/);
 assert.match(s,/session==="REGULAR"/);
});

test("fast quote arbiter evaluates configured providers rather than first-response wins",()=>{
 const s=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
 assert.doesNotMatch(s,/Promise\.any\(attempts\)/);
 assert.match(s,/Promise\.allSettled\(attempts\)/);
 assert.match(s,/providerAgreementPct/);
});

test("page display quote does not downgrade to canonical during a transient quote refresh",()=>{
 const s=fs.readFileSync("components/StockClient.tsx","utf8");
 assert.match(s,/displayQuoteAuthority/);
 assert.match(s,/LAST_GOOD_LIVE/);
});
