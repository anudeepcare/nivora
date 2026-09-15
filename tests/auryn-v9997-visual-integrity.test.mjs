import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const research=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const portfolio=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");
const page=fs.readFileSync("app/portfolio/page.tsx","utf8");
const premium=fs.readFileSync("app/auryn-premium.css","utf8");

test("decision and scenario rails use actual-value normalization",()=>{
 assert.match(research,/pricePosition/);
 assert.match(research,/scenarioPosition/);
 assert.doesNotMatch(research,/left:"49%"/);
 assert.doesNotMatch(research,/left:"58%"/);
 assert.doesNotMatch(research,/>ACCUMULATION</);
});

test("portfolio navigation implements scroll spy and section targets",()=>{
 assert.match(page,/activePortfolioSection/);
 assert.match(page,/IntersectionObserver/);
 for(const id of ["portfolio-performance","portfolio-allocation","portfolio-risk","portfolio-decisions","portfolio-holdings"]) assert.match(page,new RegExp(id));
});

test("position matrix uses weight, total return, value sizing and collision offsets",()=>{
 assert.match(portfolio,/returnPct/);
 assert.match(portfolio,/positionValue/);
 assert.match(portfolio,/matrixLayout/);
 assert.match(portfolio,/bubbleSize/);
 assert.match(portfolio,/AURYN/);
});

test("decision visuals have stronger rails",()=>{
 assert.match(premium,/v9997 visual integrity/i);
 assert.ok(premium.includes(".v940RailLine{height:7px"));
 assert.ok(premium.includes(".v941SpectrumLine{height:7px"));
});
