import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const css=()=>fs.readFileSync("app/globals.css","utf8");
test("standalone info i has no visible circle and retains 40px tap target",()=>{const s=css();assert.match(s,/\.v658InfoButton\{[^}]*min-width:40px[^}]*min-height:40px[^}]*border:0[^}]*background:transparent/s);assert.match(s,/\/\* V65\.12 global mobile readability[\s\S]*\.v658InfoButton\{[^}]*border:0[^}]*background:transparent/s)});
test("mobile readability baseline covers Analyze Portfolio and Trading Lab",()=>{const s=css();assert.match(s,/@media\(max-width:620px\)[\s\S]*--nivora-mobile-body:15px/);assert.match(s,/\.portfolioPage/);assert.match(s,/\.tradingLab/);assert.match(s,/\.stockPage/);});
test("metric sheet is viewport safe",()=>{const s=css();assert.match(s,/\.v658MetricSheet\{[^}]*max-width:calc\(100vw - 28px\)/s);assert.match(s,/max-height:calc\(100vh - 28px\)/)});
