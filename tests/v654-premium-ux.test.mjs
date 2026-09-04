import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");

test("metric help is a subtle inline info glyph, never Details or question-mark text",()=>{
 const s=read("components/v65/MetricInfo.tsx");
 assert.doesNotMatch(s,/>Details</);assert.doesNotMatch(s,/>\?</);assert.match(s,/aria-label={`About \$\{label\}`}/);assert.match(s,/v654InfoGlyph/);
});

test("analyze makes full research obviously interactive and exposes real research destinations",()=>{
 const s=read("components/InvestorDecisionHero.tsx");
 assert.match(s,/Explore full analysis/);assert.match(s,/v654ResearchNav/);for(const x of ["Fundamentals","Valuation","Technicals","Risks","Outlook"])assert.match(s,new RegExp(`>${x}<`));
});

test("analyze turns a bullish wait above a preferred entry into a concrete pullback plan",()=>{
 const s=read("components/InvestorDecisionHero.tsx");assert.match(s,/BUY ON PULLBACK/);assert.match(s,/preferred\.high/);
});

test("portfolio uses obvious add-investment control and hides empty priority cards",()=>{
 const s=read("app/portfolio/page.tsx");assert.match(s,/Add investment/);assert.match(s,/showAdd/);assert.doesNotMatch(s,/<details className="v653AddAsset"/);assert.match(s,/ranked\.length/);
});

test("trading lab explains no-trade decisions using decision blockers instead of generic no-intent copy",()=>{
 const s=read("app/trading-lab/page.tsx");assert.match(s,/auditBySymbol/);assert.match(s,/What would change it/);assert.match(s,/actionable/);
});
