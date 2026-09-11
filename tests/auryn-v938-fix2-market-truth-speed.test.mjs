import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const truth=fs.readFileSync("lib/auryn/market-truth.ts","utf8");
const gateway=fs.readFileSync("lib/auryn/market-data-gateway.ts","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");

test("regular session falls back to known regular close for research when live quote is unusable",()=>{
  assert.match(truth,/useRegularClose\(`Regular-session quotes are stale/);
  assert.match(truth,/executionTradable=false/);
  assert.match(truth,/priceUse="RESEARCH_CLOSE"/);
});

test("gateway does not fetch Alpaca bars when Twelve already supplied a usable regular close",()=>{
  assert.match(gateway,/const regularClose=twelveClose\?\?await alpacaRegularClose/);
});

test("first render uses canonical reference price independently from deep analyze",()=>{
  assert.match(stock,/const durable=canonicalV935\?\.research/);
  assert.match(stock,/price=\{priceSensitiveAllowed\?canonicalDecisionPrice:null\}/);
});

test("same URL requests are coalesced and cached",()=>{
  assert.match(stock,/const inflightJson=new Map/);
  assert.match(stock,/function sharedJson/);
  assert.match(stock,/const pending=inflightJson\.get\(url\)/);
});
