import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const fast=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
const client=fs.readFileSync("components/StockClient.tsx","utf8");
const css=fs.readFileSync("app/auryn-themes.css","utf8");

test("fast quote never accepts a stale provider quote as current",()=>{
 assert.match(fast,/MAX_RESEARCH_QUOTE_AGE_SECONDS/);
 assert.match(fast,/assertResearchQuoteFresh/);
 assert.match(fast,/ageSeconds/);
});
test("after-hours fast quote carries the actual provider timestamp and session",()=>{
 assert.match(fast,/providerTimestamp/);
 assert.match(fast,/session:/);
 assert.match(fast,/freshness:/);
});
test("client only labels a fast quote live when provider quote is fresh",()=>{
 assert.match(client,/fastQuoteProviderFresh/);
 assert.match(client,/fastQuoteFresh=.*fastQuoteProviderFresh/);
});
test("mobile search result child span cannot inherit legacy display grid",()=>{
 assert.match(css,/\.aurynSearchResults>button>\.aurynSearchResultText/);
 assert.match(css,/\.aurynSearchResults>button>\.aurynSearchOpen/);
 assert.match(css,/z-index:1000/);
});
test("mobile result is one compact row and does not cover evidence rail",()=>{
 assert.match(css,/@media\(max-width:760px\)[\s\S]*\.aurynSearchResults\{[^}]*max-height:min\(232px,28vh\)/);
 assert.match(css,/\.aurynSearchResults>button\{[^}]*min-height:58px/);
});
