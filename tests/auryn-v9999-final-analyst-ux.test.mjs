import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const ui=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const css=fs.readFileSync("app/auryn-premium.css","utf8");
test("final analyst overview uses approved compact hierarchy",()=>{for(const x of ["BUSINESS QUALITY","VALUATION","MARKET TIMING","KEY CATALYSTS","KEY RISKS","WHAT'S CHANGED","AURYN VIEW"])assert.match(ui,new RegExp(x));});
test("three clocks expose decision submetrics and evidence state",()=>{for(const x of ["Growth","Profitability","Forward evidence","Margin of safety","Market structure","Entry quality","Evidence"])assert.match(ui,new RegExp(x,"i"));});
test("scenario and decision map share one analyst visual row",()=>{assert.match(ui,/v9999DecisionVisuals/);assert.match(ui,/v9998FundamentalScenario/);assert.match(ui,/v940DecisionRail/);});
test("legacy standalone metric grid is removed from overview",()=>{assert.doesNotMatch(ui,/v937EvidenceGrid/);});
test("mobile and desktop final analyst layout are explicit",()=>{assert.match(css,/v9999DecisionVisuals/);assert.match(css,/v9999ClockMetrics/);assert.match(css,/@media\(max-width:760px\)/);});
