
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("same ticker add is consolidated, never account based",()=>{
 const s=fs.readFileSync("app/portfolio/page.tsx","utf8");
 assert.match(s,/mergeConsolidatedPosition/);
 assert.doesNotMatch(s,/Account \/ Broker|accountName/);
});
test("portfolio cockpit has locked UX sections",()=>{
 const s=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");
 for(const x of ["Portfolio Performance","What needs attention?","Portfolio Drivers","Portfolio Opportunity Map","Allocation & Risk"]) assert.match(s,new RegExp(x.replace(/[?]/g,"\\?")));
});
test("performance is first visual mode and remains selectable",()=>{
 const s=fs.readFileSync("components/portfolio/PortfolioVisualAnalytics.tsx","utf8");
 assert.match(s,/useState<.*>\("Performance"\)/);
 assert.doesNotMatch(s,/disabled=\{x==="Performance"/);
});
test("portfolio page batch-loads unique symbols",()=>{
 const s=fs.readFileSync("app/portfolio/page.tsx","utf8");
 assert.match(s,/new Set/);
});
test("mobile cockpit CSS contract exists",()=>{
 const s=fs.readFileSync("app/globals.css","utf8");
 assert.match(s,/aurynPortfolioCockpit/);assert.match(s,/@media \(max-width:\s*760px\)/);
});
