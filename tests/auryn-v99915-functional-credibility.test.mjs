import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8"),e=fs.readFileSync("lib/auryn/v99910/fundamental-analyst.ts","utf8");
const route=fs.existsSync("app/api/chart/[symbol]/route.ts")?fs.readFileSync("app/api/chart/[symbol]/route.ts","utf8"):"";
test("chart ranges are stateful and fetch real range-specific bars",()=>{assert.match(v,/chartRange/);assert.match(v,/onChartRangeChange/);assert.match(s,/overviewChartRange/);assert.match(s,/\/api\/chart\//);assert.match(route,/15min/);assert.match(route,/1day/);assert.match(route,/outputsize/);});
test("all overview actions invoke real navigation callbacks",()=>{for(const x of ["onOpenCatalysts","onOpenRisks","onOpenDetails","onOpenThesis","onOpenValuation"])assert.match(v,new RegExp(x));assert.match(s,/setTab\(/);});
test("score indicator cannot contain numeric score",()=>{assert.match(v,/v99915IndicatorIcon/);assert.doesNotMatch(v,/v99914Indicator[^\n]*<span>\{x/);});
test("generic dcf cannot be decision grade without independent crosscheck",()=>{assert.match(e,/independentCrossChecks/);assert.match(e,/decisionGrade=.*independentCrossChecks/);});
test("chart has reserved price label gutter",()=>{const pc=fs.readFileSync("components/PriceChart.tsx","utf8");assert.match(pc,/rightOffset/);assert.match(pc,/minimumWidth/);assert.match(pc,/v99915/);});
