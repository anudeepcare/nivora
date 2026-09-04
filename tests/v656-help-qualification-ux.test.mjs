import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("metric help uses a single plain i glyph without lucide circle",()=>{const s=read("components/v65/MetricInfo.tsx");assert.doesNotMatch(s,/from "lucide-react"/);assert.match(s,/>i<\/button>/);});
test("metric help is anchored beside its metric instead of fixed to the screen",()=>{const c=read("app/globals.css");assert.match(c,/\.v656MetricSheet\{position:absolute!important/);assert.doesNotMatch(c,/\.v655MetricSheet\{position:fixed!important/);});
test("qualification row explains thresholds and score meanings",()=>{const s=read("components/InvestorDecisionHero.tsx");for(const x of ["72+ strong long-term case","65+ strong enough business quality","64+ attractive enough setup"])assert.match(s,new RegExp(x.replace(/[+]/g,"\\+")));});
