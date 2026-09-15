import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
test("overview action toolbar sits with the decision hero, not below synthesis",()=>{assert.ok(v.includes("v99935DecisionActions"));assert.ok(v.includes("Add to watchlist"));assert.ok(!s.includes("v947DecisionFooter"));});
test("bottom synthesis is compact and not four giant equal cards",()=>{assert.ok(v.includes("v99935Synthesis"));assert.ok(c.includes(".v99935Synthesis"));assert.ok(c.includes("grid-template-columns:1.1fr 1.1fr 1.5fr"));});
test("AURYN view is folded into a compact decision strip",()=>{assert.ok(v.includes("v99935AurynView"));assert.ok(!v.includes("<small>AURYN VIEW</small><h3>"));});
test("catalyst tab has premium bounded layout",()=>{for(const x of ["v99935CatalystPage","v99935CatalystHero","v99935CatalystSection"])assert.ok(s.includes(x),x);assert.ok(c.includes("1480px"));});
test("catalyst hero aligns event and news intelligence",()=>{assert.ok(c.includes(".v99935CatalystHero{display:grid"));assert.ok(c.includes("grid-template-columns:minmax(0,1fr) minmax(0,1fr)"));});
