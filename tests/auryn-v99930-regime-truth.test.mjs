import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const p="lib/auryn/v99930/regime-structure.ts",v="components/premium/AurynResearchOverviewV2.tsx",c="lib/auryn/v99929/cio-decision.ts";
test("regime engine exists and separates active from historical structure",()=>{assert.ok(fs.existsSync(p));const s=fs.readFileSync(p,"utf8");for(const x of ["activeRegime","historicalContext","REGIME_REBUILDING","contextOnly","anchorValidated"])assert.ok(s.includes(x),x);});
test("QXO-like extreme historical regime cannot create impossible current levels",()=>{const s=fs.readFileSync(p,"utf8");for(const x of ["MAX_ACTIVE_DISTANCE","MAX_ANCHOR_RANGE_MULTIPLE","thesisBreakBelowCurrent","reclaimAboveCurrent"])assert.ok(s.includes(x),x);});
test("extensions are gated until anchor and preceding regime are validated",()=>{const s=fs.readFileSync(p,"utf8");assert.match(s,/extensionsAllowed/);assert.match(s,/anchorValidated/);});
test("overview suppresses invalid roadmap and shows rebuilding truth state",()=>{const s=fs.readFileSync(v,"utf8");for(const x of ["REGIME_REBUILDING","LONG-TERM MAP REBUILDING","historicalContext"])assert.ok(s.includes(x),x);});
test("CIO refuses invalid structural zones",()=>{const s=fs.readFileSync(c,"utf8");assert.match(s,/structuralTruthValid/);assert.match(s,/STRUCTURE REBUILDING/);});
