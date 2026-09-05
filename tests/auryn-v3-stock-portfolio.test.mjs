import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");

test("stock client composes focused AURYN V3 presentation modules",()=>{
 const src=read("components/StockClient.tsx");
 for(const name of ["StockSecurityHeader","StockDecisionSummary","StockActionPlan","StockEvidenceNav","StockEvidenceSections"]){
   assert.match(src,new RegExp(name));
 }
});

test("portfolio uses the V3 page composition and canonical holdings intelligence",()=>{
 const src=read("app/portfolio/page.tsx");
 assert.match(src,/aurynPortfolioPage/);
 assert.match(src,/HoldingsIntelligence/);
 assert.doesNotMatch(src,/v6519Portfolio|v6515Portfolio|v65Portfolio/);
});
