import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout=fs.readFileSync("app/layout.tsx","utf8");
const mobile=fs.readFileSync("app/auryn-mobile.css","utf8");
const header=fs.readFileSync("components/stock/StockSecurityHeader.tsx","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const premium=fs.readFileSync("app/auryn-premium.css","utf8");

test("only one authoritative mobile stylesheet is imported",()=>{
  assert.match(layout,/import "\.\/auryn-mobile\.css";/);
  assert.doesNotMatch(layout,/auryn-mobile-v94[456]\.css/);
});

test("mobile stock masthead has purpose-built composition",()=>{
  assert.match(header,/aurynStockMobileMasthead/);
  assert.match(header,/aurynStockMobilePrimary/);
  assert.match(header,/aurynStockMobileMeta/);
  assert.match(header,/aurynStockMobileFacts/);
});

test("desktop stock masthead remains separately addressable",()=>{
  assert.match(header,/aurynStockDesktopMasthead/);
});

test("mobile stock primary row is compact and aligned",()=>{
  assert.match(mobile,/\.aurynStockMobileMasthead\{/);
  assert.match(mobile,/\.aurynStockMobilePrimary\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(mobile,/\.aurynStockMobileTicker\{[^}]*font-size:28px/);
});

test("mobile facts use a four-column strip",()=>{
  assert.match(mobile,/\.aurynStockMobileFacts\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test("mobile header/search remain compact",()=>{
  assert.match(mobile,/\.aurynHeader\{[^}]*height:calc\(50px \+ env\(safe-area-inset-top\)\)/);
  assert.match(mobile,/\.aurynMobileSearch form\{[^}]*height:44px/);
});

test("portfolio and technicals retain structural mobile layouts",()=>{
  assert.match(mobile,/\.aurynPortfolioSummary\{[^}]*grid-template-columns:1fr/);
  assert.match(mobile,/\.aurynPositionFacts\{[^}]*display:none/);
  assert.match(mobile,/\.v34IndicatorGrid>div\{[^}]*grid-template-columns:minmax\(96px/);
});

test("desktop decision footer has an explicit wrapper",()=>{
  assert.match(stock,/v947DecisionFooter/);
  assert.match(premium,/\.v947DecisionFooter\{/);
  assert.match(premium,/\.v947DecisionFooter \.v6510ActionToolbar\{/);
});

test("desktop footer keeps levels near actions",()=>{
  assert.match(premium,/@media\(min-width:901px\)\{[^]*\.v947DecisionFooter/);
});
