import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";const read=p=>fs.readFileSync(p,"utf8");
test("portfolio user-facing patience copy says AURYN, not NIVORA",()=>{const s=read("lib/v65/portfolio.ts");assert.doesNotMatch(s,/Current NIVORA evidence/);assert.match(s,/Current AURYN evidence/);});
test("legal pages have V3 styling",()=>{const css=read("app/auryn-product.css");for(const c of ["legalPage","legalTop","legalLinks"])assert.match(css,new RegExp(`\\.${c}`));});
