import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const overview=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const css=fs.readFileSync("app/auryn-premium.css","utf8");

test("decision pulse uses explicit primary and supporting lines",()=>{
 assert.match(overview,/v941PulseMetric/);
 assert.match(css,/\.v941PulseMetric>b/);
 assert.match(css,/\.v941PulseMetric>span/);
});

test("market outlook is a horizontal spectrum not nested mini cards",()=>{
 assert.match(overview,/v941ScenarioSpectrum/);
 assert.match(overview,/v941ScenarioCurrent/);
 assert.doesNotMatch(overview,/v938ScenarioTile bull/);
});

test("technical visuals are metric-specific rather than generic lines",()=>{
 assert.match(stock,/v941RsiTrack/);
 assert.match(stock,/v941VolumeTrack/);
 assert.match(stock,/v941BollingerTrack/);
 assert.doesNotMatch(css,/\.v34IndicatorGrid>div::after/);
});

test("research masthead and nav use compact aligned desktop geometry",()=>{
 assert.match(css,/\.aurynStockMasthead\{[^}]*min-height:96px!important/);
 assert.match(css,/\.aurynEvidenceNav\{[^}]*margin-top:0!important/);
});

test("shared research spine uses one max width and gutters",()=>{
 assert.match(css,/--v941-content-max:1680px/);
 assert.match(css,/\.aurynStockMasthead,.aurynEvidenceNav,.v936Overview,.aurynStockResearch/);
});

test("mobile has independent alignment contract",()=>{
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/\.v941ScenarioSpectrum/);
 assert.match(css,/\.v940PulseGroups/);
});
