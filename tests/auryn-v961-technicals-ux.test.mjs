import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync(new URL("../app/auryn-themes.css",import.meta.url),"utf8");

test("V9.6.1 Technicals uses one premium analytical composition",()=>{
  assert.match(css,/TECHNICALS V9\.6\.1 — PREMIUM ANALYTICAL COMPOSITION/);
  assert.match(css,/\.v34TechnicalHero,.v383TechnicalHero\{[^}]*grid-template-columns:minmax\(0,1fr\) 260px/s);
  assert.match(css,/\.v383TechnicalStateGrid,.v34TechnicalScoreGrid\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)[^}]*gap:10px/s);
  assert.match(css,/\.v34IndicatorGrid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)[^}]*gap:14px/s);
});

test("factor cards are independent cards, not a segmented spreadsheet band",()=>{
  assert.match(css,/\.v383TechnicalStateGrid>\*,.v34TechnicalScoreGrid>\*\{[^}]*border:1px solid var\(--auryn-border\)[^}]*border-radius:14px/s);
  assert.match(css,/\.v383TechnicalStateGrid>\*,.v34TechnicalScoreGrid>\*\{[^}]*background:var\(--auryn-card-bg\)/s);
});

test("indicator cards have a deterministic four-level reading hierarchy",()=>{
  assert.match(css,/\.v34IndicatorGrid>div\{[^}]*min-height:156px[^}]*display:flex[^}]*flex-direction:column/s);
  assert.match(css,/\.v34IndicatorGrid>div>b\{[^}]*font-size:24px/s);
});

test("mobile Technicals becomes a clean single-column analytical feed",()=>{
  assert.match(css,/@media\(max-width:760px\)[\s\S]*\.v383TechnicalStateGrid,.v34TechnicalScoreGrid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}[\s\S]*\.v34IndicatorGrid\{grid-template-columns:1fr!important/s);
});
