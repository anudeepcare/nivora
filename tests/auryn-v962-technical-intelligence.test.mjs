import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const stock=fs.readFileSync(new URL("../components/StockClient.tsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../app/auryn-themes.css",import.meta.url),"utf8");

test("V9.6.2 replaces dashboard tiles with analyst-report composition",()=>{
 for(const cls of ["v962TechnicalRead","v962ScoreRail","v962DriverStack","v962DriverRow","v962BottomLine"]) assert.ok(stock.includes(cls),cls);
 assert.ok(!stock.includes('className="v34IndicatorGrid"'));
 assert.ok(!stock.includes('className="v383TechnicalStateGrid v34TechnicalScoreGrid"'));
});

test("four driver rows group the eight technical indicators",()=>{
 for(const label of ["MOMENTUM","TREND","PARTICIPATION","ENTRY &amp; RISK"]) assert.ok(stock.includes(`>${label}<`),label);
 assert.equal((stock.match(/className="v962DriverRow"/g)||[]).length,4);
});

test("Technical Read has interpretation-first hierarchy",()=>{
 assert.match(stock,/TECHNICAL READ/);
 assert.match(stock,/WHAT IS DRIVING THE SCORE/);
 assert.match(stock,/BOTTOM LINE/);
});

test("desktop uses a constrained reading width and no card grid",()=>{
 assert.match(css,/TECHNICAL INTELLIGENCE V9\.6\.2/);
 assert.match(css,/\.v962TechnicalExperience\{[^}]*max-width:1280px[^}]*margin:0 auto/s);
 assert.match(css,/\.v962ScoreRail\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/s);
 assert.match(css,/\.v962DriverStack\{[^}]*display:flex[^}]*flex-direction:column/s);
});

test("mobile becomes a single-column report",()=>{
 assert.match(css,/@media\(max-width:760px\)[\s\S]*\.v962TechnicalRead\{grid-template-columns:1fr!important\}[\s\S]*\.v962DriverRow\{grid-template-columns:1fr!important\}/s);
});
