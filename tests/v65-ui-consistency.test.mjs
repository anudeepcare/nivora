
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("shared V65 MetricInfo exists and stock hero consumes it",()=>{
 const m=fs.readFileSync("components/v65/MetricInfo.tsx","utf8");
 const h=fs.readFileSync("components/InvestorDecisionHero.tsx","utf8");
 assert.match(m,/aria-expanded/);assert.match(m,/Escape/);assert.match(m,/v65MetricInfo/);
 assert.match(h,/components\/v65\/MetricInfo/);
});
test("stock decision hero separates long-term new-money and owner guidance",()=>{
 const h=fs.readFileSync("components/InvestorDecisionHero.tsx","utf8");
 assert.match(h,/LONG-TERM VIEW/);assert.match(h,/NEW MONEY TODAY/);assert.match(h,/IF YOU OWN IT/);
});
test("portfolio page supports asset type equity crypto cash",()=>{
 const p=fs.readFileSync("app/portfolio/page.tsx","utf8");
 for(const x of ["EQUITY","CRYPTO","CASH"])assert.ok(p.includes(x));
 assert.match(p,/DEPLOYABLE CASH/);assert.match(p,/CONCENTRATION/);assert.match(p,/ALLOCATION/);
});
test("Trading Lab explicitly distinguishes connectivity execution and learning",()=>{
 const p=fs.readFileSync("app/trading-lab/page.tsx","utf8");
 assert.match(p,/EXECUTION STATE/);assert.match(p,/LEARNING STATE/);assert.match(p,/MATURED OUTCOMES/);
});
