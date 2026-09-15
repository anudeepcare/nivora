import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const r=fs.readFileSync("lib/auryn/v99930/regime-structure.ts","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
test("extensions are not disabled merely because price already reclaimed confirmation",()=>{assert.ok(!r.includes("anchorValidated&&reclaimAboveCurrent&&dist(r.priorHigh)<=1.5"));});
test("recent-regime rebuild recomputes its own 1.272 and 1.618 extensions",()=>{assert.match(r,/extension1272=swingLow\+range\*1\.272/);assert.match(r,/extension1618=swingLow\+range\*1\.618/);});
test("validated comparable regime can publish conditional upside extensions",()=>{assert.match(r,/extensionsAllowed=Boolean\(anchorValidated&&.*priorHigh/);});
test("UI never prints dash arrows inside upside sequence",()=>{assert.ok(v.includes("upsideValues"));assert.ok(v.includes(".filter((x):x is number=>x!=null)"));});
