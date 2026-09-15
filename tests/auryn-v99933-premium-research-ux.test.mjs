import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
test("single AURYN Call remains the only decision hero",()=>{assert.ok(v.includes("v99932CallDecision"));assert.ok(!v.includes('className="v99929Cio"'));});
test("call receives semantic state class",()=>{assert.ok(v.includes("v99933CallState"));assert.ok(v.includes("callStateTone"));for(const x of ["buy","wait","hold","avoid"])assert.ok(c.includes(`.v99933CallState.${x}`),x);});
test("four pillars are compact analyst summaries",()=>{assert.ok(v.includes("v99933AnalystGrid"));assert.ok(v.includes("v99933Insight"));assert.ok(c.includes("min-height:190px"));});
test("pillar status gets semantic state accents",()=>{for(const x of ["positive","caution","negative","neutral"])assert.ok(c.includes(`.v99933AnalystCard.${x}`),x);});
test("weekly card tells what matters instead of accumulation headline",()=>{assert.ok(v.includes("weeklyStructureLabel"));assert.ok(v.includes("Near weekly support"));assert.ok(v.includes("Below key weekly averages"));});
test("negative FCF is explicitly interpreted",()=>{assert.ok(v.includes("Negative FCF"));assert.ok(v.includes("Conventional FCF valuation is not reliable"));});
test("desktop density is intentionally compact",()=>{assert.ok(c.includes(".v99933FirstScreen"));assert.ok(c.includes("grid-template-columns:43fr 40fr 17fr"));});
