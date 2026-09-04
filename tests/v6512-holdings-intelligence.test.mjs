import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=()=>fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8");
test("asset semantics are Shares Units Amount",()=>{const x=s();for(const q of ["Shares","Units","Amount"])assert.match(x,new RegExp(q));});
test("holding intelligence displays company truth separately from portfolio action",()=>{const x=s();assert.match(x,/Company view/);assert.match(x,/Portfolio action/);assert.match(x,/Thesis/);assert.match(x,/Opportunity/);});
test("portfolio page renders Holdings Intelligence",()=>{const x=fs.readFileSync("app/portfolio/page.tsx","utf8");assert.match(x,/HoldingsIntelligence/);});
