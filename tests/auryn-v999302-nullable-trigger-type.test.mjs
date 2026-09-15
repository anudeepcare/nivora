import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("CIO change triggers are narrowed to string array",()=>{const s=fs.readFileSync("lib/auryn/v99929/cio-decision.ts","utf8");assert.match(s,/filter\(\(x\): x is string => Boolean\(x\)\)/);});
test("JSX map does not lie about nullable callback parameter",()=>{const s=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");assert.doesNotMatch(s,/whatChangesIt\.map\(\(x:string\)/);});
