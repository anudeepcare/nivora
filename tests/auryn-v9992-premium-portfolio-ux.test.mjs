
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const pulse=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");
const chart=fs.readFileSync("components/portfolio/PortfolioPerformanceChart.tsx","utf8");
test("one primary performance surface only",()=>{
 assert.equal((pulse.match(/Portfolio Performance/g)||[]).length,1);
 assert.doesNotMatch(pulse,/PortfolioVisualAnalytics/);
});
test("premium first screen exposes useful metrics",()=>{
 for(const x of ["TODAY P/L","TOTAL P/L","INVESTED","CASH","POSITIONS","HEALTH"]) assert.match(pulse,new RegExp(x.replace("/","\\/")));
});
test("performance chart has dominant portfolio area, benchmark lines and hover tooltip",()=>{
 assert.match(chart,/linearGradient/);assert.match(chart,/onMouseMove/);assert.match(chart,/aurynChartTooltip/);assert.match(chart,/areaPath/);
});
test("drivers are visual contribution bars",()=>assert.match(pulse,/aurynContributionBar/));
test("allocation and risk has allocation donut",()=>assert.match(pulse,/aurynAllocationDonut/));
test("only one action surface remains",()=>{
 assert.match(pulse,/What needs attention\?/);assert.doesNotMatch(pulse,/Capital Queue/);
});
test("opportunity map fails useful when opportunity coverage is weak",()=>{
 assert.match(pulse,/Position Matrix/);assert.match(pulse,/opportunityCoverage/);
});
test("health methodology is compact not a second giant section",()=>{
 assert.match(pulse,/aurynHealthPopover/);assert.doesNotMatch(pulse,/import PortfolioHealth/);
});
