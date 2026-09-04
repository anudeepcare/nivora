import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=()=>fs.readFileSync("components/portfolio/PortfolioHealth.tsx","utf8");
test("health UI explains score, drags, improvements and goal fit",()=>{const x=s();for(const q of ["Why this score","Holding it back","Improve portfolio","Goal fit"])assert.match(x,new RegExp(q));assert.doesNotMatch(x,/\+\d+\s*points|reach 80/i)});
test("health UI says score is diagnostic not a trading target",()=>{assert.match(s(),/Do not trade just to raise this score/);});
test("Pulse renders explanatory PortfolioHealth instead of bare health number",()=>{const x=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");assert.match(x,/PortfolioHealth/);});
