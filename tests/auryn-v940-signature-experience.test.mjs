import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const overview=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const css=fs.readFileSync("app/auryn-premium.css","utf8");

test("signature hero contains compact decision proof rail",()=>{
 assert.match(overview,/v940HeroProof/);
 assert.match(overview,/Opportunity/);
 assert.match(overview,/Evidence/);
 assert.match(overview,/Entry/);
 assert.match(overview,/Confirm/);
});

test("decision map has a current-price position on one visual rail",()=>{
 assert.match(overview,/v940DecisionRail/);
 assert.match(overview,/v940CurrentMarker/);
 assert.match(overview,/CURRENT/);
});

test("pulse is grouped into decision trigger asymmetry and trust",()=>{
 for(const x of ["DECISION","TRIGGER","ASYMMETRY","TRUST"])assert.match(overview,new RegExp(x));
 assert.match(css,/\.v940PulseGroup/);
});

test("pending canonical state preserves last verified snapshot when available",()=>{
 assert.match(stock,/LAST VERIFIED AURYN DECISION/);
 assert.match(stock,/Refreshing deeper evidence/);
});

test("mobile signature contract is explicitly designed for narrow screens",()=>{
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/\.v940DecisionRail/);
 assert.match(css,/\.v940PulseGroups/);
});

test("technical surface gets signature metric-specific visual treatment",()=>{
 assert.match(css,/\.v941RsiTrack::after/);
 assert.match(css,/\.v941VolumeTrack::after/);
 assert.match(css,/\.v941BollingerTrack::after/);
 assert.match(css,/\.v34TechnicalScoreGrid/);
});
