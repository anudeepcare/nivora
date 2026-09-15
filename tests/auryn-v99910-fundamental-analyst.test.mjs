import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const engine=fs.readFileSync("lib/auryn/v99910/fundamental-analyst.ts","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const ui=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
test("fundamental engine uses SEC economics and no technical levels",()=>{for(const x of ["revGrowth","fcf","opMargin","grossMargin","leverage","fiveYearRecord"])assert.match(engine,new RegExp(x));assert.doesNotMatch(engine,/breakout|support|resistance|RSI|momentum/i);});
test("valuation scenarios are explicit policy assumptions with confidence",()=>{for(const x of ["bear","base","bull","discountRate","terminalGrowth","confidence","basis","assumptions"])assert.match(engine,new RegExp(x));});
test("stock client passes analyst fundamentals to overview",()=>{assert.match(stock,/analystFundamentals/);assert.match(stock,/rawMetrics/);});
test("overview presents scenario assumptions and company dimensions",()=>{assert.match(ui,/fundamentalScenario\.assumptions/);assert.match(ui,/companyDimensions/);assert.match(ui,/Fair value/);});
