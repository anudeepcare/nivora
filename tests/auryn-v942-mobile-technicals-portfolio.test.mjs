import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/auryn-premium.css","utf8");
const product=fs.readFileSync("app/auryn-product.css","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const holdings=fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8");
const portfolio=fs.readFileSync("app/portfolio/page.tsx","utf8");

test("mobile stock masthead always prioritizes identity price and live state",()=>{
 assert.match(css,/\.aurynStockMasthead\{[^}]*grid-template-areas:"identity market"/);
 assert.match(css,/\.aurynStockMarket\{[^}]*grid-area:market/);
 assert.match(css,/\.aurynStockIdentityWrap\{[^}]*grid-area:identity/);
});

test("mobile shell removes giant dead gap and owns safe area cleanly",()=>{
 assert.match(css,/\.aurynMobileSearch\{[^}]*margin-top:0!important/);
 assert.match(css,/\.aurynStockPage\{[^}]*padding-top:0!important/);
 assert.match(css,/overflow-x:hidden/);
});

test("mobile call hero is bounded and does not consume a full screen",()=>{
 assert.match(css,/\.v936CallHero\{[^}]*min-height:0!important[^}]*height:auto!important/);
 assert.match(css,/\.v936CallHero::after\{[^}]*max-height/);
});

test("technicals has real RSI volume and bollinger scales plus MACD zero axis",()=>{
 assert.match(stock,/v942RsiScale/);
 assert.match(stock,/v942MacdHistogram/);
 assert.match(stock,/v942VolumeScale/);
 assert.match(stock,/v942BollingerScale/);
});

test("mobile technical grid has deliberate responsive geometry",()=>{
 assert.match(css,/\.v34IndicatorGrid\{[^}]*grid-template-columns:1fr 1fr!important/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/\.v942MacdHistogram/);
});

test("portfolio mobile intro exposes an unclipped add action",()=>{
 assert.match(portfolio,/aurynMobileAddInvestment/);
 assert.match(product,/\.aurynMobileAddInvestment/);
});

test("mobile holding cards expose an explicit action menu",()=>{
 assert.match(holdings,/aurynPositionMenu/);
 assert.match(holdings,/Edit position/);
 assert.match(holdings,/Delete position/);
 assert.match(product,/\.aurynPositionMenu/);
});

test("portfolio mobile page cannot horizontally overflow",()=>{
 assert.match(product,/\.aurynPortfolioPage\{[^}]*overflow-x:hidden/);
 assert.match(product,/\.aurynPortfolioNav\{[^}]*overflow-x:auto/);
});
