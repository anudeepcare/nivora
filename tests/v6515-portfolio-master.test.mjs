import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("Portfolio keeps meaningful visual modes and benchmarks",()=>{const v=read("components/portfolio/PortfolioVisualAnalytics.tsx"),p=read("components/portfolio/PortfolioPulse.tsx");for(const q of ["Performance","Drivers","Allocation","Risk"])assert.match(v,new RegExp(q));assert.match(v,/PortfolioPerformanceChart/);assert.match(p,/SPY/);});
test("XRay keeps five useful angles without Unknown",()=>{const x=read("components/portfolio/PortfolioXRay.tsx");for(const q of ["Sector","Theme","Asset","Risk","Correlation"])assert.match(x,new RegExp(q));assert.doesNotMatch(x,/Unknown|pending/i)});
test("Portfolio has one holdings list and Qty label",()=>{const x=read("app/portfolio/page.tsx");assert.match(x,/v65PositionList/);assert.match(x,/<small>Qty<\/small>/);assert.doesNotMatch(x,/>Units<|>Shares</);assert.doesNotMatch(x,/HoldingsIntelligence/);});
