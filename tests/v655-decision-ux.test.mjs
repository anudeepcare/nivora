import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");

test("decision qualification is explained in plain English",()=>{const s=read("components/InvestorDecisionHero.tsx");assert.match(s,/To qualify for new capital/);assert.match(s,/Business case/);assert.match(s,/Company quality/);assert.match(s,/Current setup/);});
test("research destinations are obvious button-like controls",()=>{const s=read("components/InvestorDecisionHero.tsx");assert.match(s,/v655ResearchChoice/);for(const x of ["Fundamentals","Valuation","Technicals","Risks","Outlook"])assert.match(s,new RegExp(`>${x}<`));});
test("metric help uses one glyph and viewport-safe positioning",()=>{const m=read("components/v65/MetricInfo.tsx"),c=read("app/globals.css");assert.match(m,/>i<\/button>/);assert.match(c,/\.v656MetricSheet/);assert.match(c,/position:absolute/);});
test("portfolio removes redundant start-here heading",()=>{const s=read("app/portfolio/page.tsx");assert.doesNotMatch(s,/>Start here\.</);assert.match(s,/PortfolioPulse/);});
test("trading lab tells the user what qualified and what stopped a trade",()=>{const s=read("app/trading-lab/page.tsx");assert.match(s,/QUALIFIED NOW/);assert.match(s,/Why no order/);});
test("auth surfaces use the new decision-first promise",()=>{for(const p of ["app/login/page.tsx","app/register/page.tsx"]){const s=read(p);assert.match(s,/Know what to do next/);}});
