import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),p=fs.readFileSync("app/auryn-premium.css","utf8"),u=fs.readFileSync("app/auryn-unified-ui.css","utf8"),l=fs.readFileSync("app/layout.tsx","utf8");
test("help popover is anchored to clicked helper",()=>{assert.match(v,/helpAnchor/);assert.match(v,/v99928HelpWrap/);assert.match(p,/\.v99928HelpWrap\{position:relative/);});
test("execution map merges close entry/current nodes robustly",()=>{assert.ok(v.includes("clusterMapNodes(mapNodes,.035)"));assert.ok(v.includes('ENTRY / CURRENT'));});
test("global unified typography stylesheet is loaded last",()=>{assert.match(l,/auryn-unified-ui\.css/);assert.match(u,/--auryn-ui-font/);assert.match(u,/--auryn-display-font/);});
test("all major app surfaces inherit the same typography contract",()=>{for(const x of [".aurynStockPage",".aurynPortfolioPage",".aurynMonitorPage",".aurynTradingLabPage",".aurynOverviewV2"])assert.ok(u.includes(x),x);});
test("unified stylesheet normalizes headings, controls and evidence text",()=>{for(const x of ["button,input,select,textarea","font-family:var(--auryn-ui-font)","font-family:var(--auryn-display-font)"])assert.ok(u.includes(x),x);});
