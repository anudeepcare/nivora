import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("app/auryn-premium.css","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const overview=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");

test("desktop decision and chart use a bounded first-viewport hero",()=>{
  assert.match(css,/\.v936HeroGrid\{height:min\(342px,calc\(100vh - 485px\)\)/);
  assert.match(css,/\.v936ChartCard \.chartCanvas\{min-height:0!important;height:calc\(100% - 42px\)!important\}/);
});

test("mobile research chrome and progressive state are compact",()=>{
  assert.match(css,/\.aurynHeader\{height:52px!important/);
  assert.match(css,/\.aurynProgressiveResearch\{padding:18px 16px!important;min-height:0!important/);
  assert.match(css,/\.v936ChartCard \.chartCanvas\{min-height:220px!important;height:220px!important\}/);
});

test("holdings use seven fact columns on desktop to avoid wrapped weight",()=>{
  assert.match(css,/\.aurynPositionFacts\{grid-template-columns:repeat\(7,minmax\(70px,1fr\)\)!important/);
});

test("noncritical evidence is staggered instead of provider burst",()=>{
  assert.match(stock,/for\(const job of jobs\)/);
  assert.match(stock,/setTimeout\(r,220\)/);
  assert.doesNotMatch(stock,/Promise\.allSettled\(\[\s*fetchJson\(`\/api\/company/);
});

test("canonical and news polling are paced",()=>{
  assert.match(stock,/loadCanonical\(\);timer=setInterval\(\(\)=>\{if\(document\.visibilityState==="visible"\)loadCanonical\(\)\},30000\)/);
  assert.match(stock,/\/api\/context\/.*300000/s);
});

test("decision metrics explicitly avoid probability and forecast claims",()=>{
  assert.match(overview,/It is not a probability of profit/);
  assert.match(overview,/It is not an expected-return forecast/);
  assert.match(overview,/never inferred from portfolio value/);
});
