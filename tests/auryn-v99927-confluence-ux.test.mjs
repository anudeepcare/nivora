import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),e=fs.readFileSync("lib/auryn/v99925/long-term-roadmap.ts","utf8");
test("help is click/tap accessible, not title-only",()=>{assert.match(v,/activeHelp/);assert.match(v,/role="dialog"/);assert.match(v,/v99927HelpPopover/);});
test("roadmap derives decision confluence zones",()=>{for(const x of ["buildConfluenceZones","ACTIVE WEEKLY SUPPORT","DEEP CYCLE SUPPORT","HOLD ABOVE","FUTURE RECLAIM","UPSIDE SEQUENCE"])assert.ok(v.includes(x),x);});
test("current price is explicit in long-term roadmap",()=>{assert.match(v,/CURRENT POSITION/);assert.match(v,/v99927CurrentPosition/);});
test("fundamental and execution cards are compact",()=>{assert.match(c,/v99927CoreGrid/);assert.match(c,/min-height:0/);});
test("roadmap help explains basis and evidence",()=>{for(const x of ["Fib retracement","WMA / HMA","volume participation","structural support"])assert.ok(v.includes(x),x);});
