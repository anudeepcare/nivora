import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("MetricInfo renders a real SVG circle, not a bare text i",()=>{const x=read("components/v65/MetricInfo.tsx");assert.match(x,/v6516InfoGlyph/);assert.match(x,/<circle/);assert.match(x,/<text/);assert.doesNotMatch(x,/>i<\/button>/)});
test("final analyze typography contract is explicit and consistent",()=>{const x=read("app/globals.css");for(const q of [".stockPage .v65FactorGrid small",".stockPage .v65FactorGrid b",".stockPage .v65ThesisGrid small",".stockPage .v65ThesisGrid b",".stockPage .v65ExplainGrid"])assert.match(x,new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));});
