import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const exists=p=>fs.existsSync(p);
const read=p=>fs.readFileSync(p,"utf8");

test("fast quote lane exists and is explicitly research-only",()=>{
  assert.ok(exists("lib/auryn/fast-quote.ts"));
  const src=read("lib/auryn/fast-quote.ts");
  assert.match(src,/researchOnly:true/);
  assert.match(src,/executionVerified:false/);
  assert.match(src,/api\.twelvedata\.com\/quote/);
});

test("server quote route keeps provider key server-side and responds quickly",()=>{
  assert.ok(exists("app/api/quote/[symbol]/route.ts"));
  const src=read("app/api/quote/[symbol]/route.ts");
  assert.match(src,/TWELVE_DATA_API_KEY/);
  assert.match(src,/Cache-Control/);
  assert.doesNotMatch(src,/NEXT_PUBLIC_TWELVE/);
});

test("StockClient has independent fast quote state and display price",()=>{
  const src=read("components/StockClient.tsx");
  assert.match(src,/const\[fastQuote,setFastQuote\]/);
  assert.match(src,/\/api\/quote\/\$\{encodeURIComponent\(symbol\)\}/);
  assert.match(src,/const researchDisplayPrice=/);
  assert.match(src,/price=\{researchDisplayPrice\}/);
});

test("fast quote never replaces canonical decision price",()=>{
  const src=read("components/StockClient.tsx");
  assert.match(src,/const canonicalDecisionPrice=/);
  assert.match(src,/price:canonicalDecisionPrice/);
  assert.doesNotMatch(src,/price:researchDisplayPrice,canonicalMarketSnapshot/);
});

test("search warms likely fast quote endpoints",()=>{
  const src=read("components/SearchBox.tsx");
  assert.match(src,/\/api\/quote\/\$\{encodeURIComponent\(x\.symbol\)\}/);
});

test("header does not manufacture 0 percent change",()=>{
  const src=read("components/stock/StockSecurityHeader.tsx");
  assert.match(src,/hasChange&&/);
  assert.doesNotMatch(src,/changePct\?\?0/);
});
