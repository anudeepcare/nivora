import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),e=fs.readFileSync("lib/auryn/v99925/long-term-roadmap.ts","utf8");
test("decision map groups near-identical levels instead of overlapping labels",()=>{assert.match(v,/clusterMapNodes/);assert.match(v,/ENTRY \/ CURRENT/);});
test("desktop decision cards use readable labels and values",()=>{assert.match(c,/v99926PillarGrid/);assert.match(c,/white-space:nowrap/);assert.match(c,/font-size:11px/);});
test("every pillar exposes a basis help control",()=>{assert.ok((v.match(/v99926Help/g)||[]).length>=4);assert.match(v,/How AURYN determines this/);});
test("long-term engine includes HMA, volume participation, trend channel and confluence",()=>{for(const x of ["hma","volumeRatio","accumulationScore","trendChannel","confluenceScore"])assert.ok(e.includes(x),x);});
test("overview presents richer technical evidence cleanly",()=>{for(const x of ["Weekly HMA","Volume participation","Accumulation / Distribution","Trend channel","Confluence"])assert.ok(v.includes(x),x);});
