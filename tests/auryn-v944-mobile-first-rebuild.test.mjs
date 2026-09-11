import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("app/auryn-mobile-v944.css","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");
const holdings=fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8");

test("v944 mobile stylesheet is loaded last",()=>{
  assert.match(layout,/import "\.\/auryn-mobile-v944\.css";/);
  assert.ok(layout.indexOf("auryn-mobile-v944.css") > layout.indexOf("auryn-mobile.css"));
});

test("mobile app chrome has bounded header and normal-flow search",()=>{
  assert.match(css,/\.aurynHeader\{[^}]*height:calc\(56px \+ env\(safe-area-inset-top\)\)/);
  assert.match(css,/\.aurynMobileSearch\{[^}]*position:relative/);
  assert.match(css,/\.aurynHeader \.aurynBrand\{[^}]*margin:0/);
});

test("research landing uses compact first viewport",()=>{
  assert.match(css,/\.aurynResearchHero\{[^}]*padding:24px 0 22px/);
  assert.match(css,/\.aurynResearchHero h1\{[^}]*font-size:clamp\(40px,11vw,50px\)/);
});

test("auth mobile shell does not create giant top whitespace",()=>{
  assert.match(css,/\.aurynAuthPage\{[^}]*padding:0/);
  assert.match(css,/\.aurynAuthPanel\{[^}]*padding:calc\(env\(safe-area-inset-top\) \+ 18px\) 20px/);
});

test("portfolio mobile headings and cards are viewport bounded",()=>{
  for(const cls of ["aurynPortfolioIntro","v934PortfolioIntel","aurynCapitalPriorities","aurynPortfolioVisuals","aurynHoldingsSection"]){
    assert.match(css,new RegExp(`\\.${cls}[^}]*max-width:100%`));
  }
});

test("holdings are compact mobile cards with essential metrics",()=>{
  assert.match(holdings,/aurynPositionMobileSummary/);
  assert.match(css,/\.aurynPositionMobileSummary\{/);
  assert.match(css,/\.aurynPositionFacts\{[^}]*display:none/);
});

test("capital queue is compact and wraps text",()=>{
  assert.match(css,/\.aurynCapitalQueueRow\{[^}]*grid-template-columns:1fr 1fr/);
  assert.match(css,/overflow-wrap:anywhere/);
});

test("performance period row scrolls instead of clipping",()=>{
  assert.match(css,/\.aurynPeriodTabs\{[^}]*overflow-x:auto/);
});

test("stock masthead and hero fit mobile first viewport",()=>{
  assert.match(css,/\.aurynStockMasthead\{[^}]*grid-template-areas:"identity market" "facts facts"/);
  assert.match(css,/\.v936CallHero\{[^}]*padding:18px 16px 15px/);
});

test("all key roots forbid horizontal overflow",()=>{
  assert.match(css,/\.aurynPortfolioPage,.aurynAlertsPage,.aurynTradingLab,.simplePage,.aurynStockPage,.aurynResearchHome\{[^}]*overflow-x:hidden/);
});
