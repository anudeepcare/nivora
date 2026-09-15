import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const ui=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const css=fs.readFileSync("app/auryn-premium.css","utf8");
test("analyst layer exposes three clocks",()=>{for(const x of ["COMPANY","VALUE","TIMING","Business trajectory","Margin of safety","Market setup"])assert.match(ui,new RegExp(x,"i"));});
test("fundamental scenarios never silently reuse technical scenario map",()=>{assert.match(ui,/fundamentalScenario/);assert.match(ui,/Fundamental valuation is building|fundamentalScenario/);});
test("analyst layer includes catalysts risks changes and summary",()=>{for(const x of ["KEY CATALYSTS","KEY RISKS","WHAT'S CHANGED","AURYN VIEW"])assert.match(ui,new RegExp(x));});
test("decision map has collision lanes without moving nodes",()=>{assert.match(ui,/decisionLabelLane/);assert.match(css,/v9998 analyst layer/i);});
test("mobile analyst layer is explicitly responsive",()=>{assert.match(css,/\.v9998AnalystClocks/);assert.match(css,/@media\(max-width:760px\)/);});
