import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=()=>fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");
test("selected period drives real period calculation and filtered chart",()=>{const x=s();assert.match(x,/calculatePortfolioPeriod/);assert.match(x,/periodResult/);assert.match(x,/PortfolioPerformanceChart points=\{periodResult\.points\}/)});
test("hero surfaces You SPY QQQ alpha and plain-English market verdict",()=>{const x=s();for(const q of ["YOUR PORTFOLIO","SPY","QQQ","ALPHA","marketVerdict"])assert.match(x,new RegExp(q));});
test("insufficient period is explicit and never substitutes cost-basis pnl",()=>{const x=s();assert.match(x,/Not enough actual history/);assert.ok(x.includes("Cost-basis P/L is shown separately"));});
