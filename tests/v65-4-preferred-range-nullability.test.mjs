import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("preferred high is narrowed before numeric comparison",()=>{const s=fs.readFileSync("components/InvestorDecisionHero.tsx","utf8");assert.match(s,/preferred\?\.high!=null && price>preferred\.high/);assert.doesNotMatch(s,/Boolean\(preferred&&price>preferred\.high\)/);});
