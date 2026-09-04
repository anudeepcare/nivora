import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const css=fs.readFileSync("app/globals.css","utf8"), info=fs.readFileSync("components/v65/MetricInfo.tsx","utf8");
test("info affordance is visibly circled and keeps large hit target",()=>{assert.match(css,/\.v658InfoButton\{[^}]*border:1px solid[^}]*border-radius:50%/s);assert.match(css,/\.v658InfoButton::after\{[^}]*inset:-11px/s);assert.match(info,/>i<\/button>/)});
test("shared mobile baseline is 16px and desktop nav is readable",()=>{assert.match(css,/@media\(max-width:620px\)[\s\S]*--nivora-mobile-body:16px/);assert.match(css,/@media\(min-width:900px\)[\s\S]*\.v65DesktopNav[^}]*font-size:14px/s)});
test("core surfaces share typography tokens",()=>{for(const q of [".stockPage",".portfolioPage",".tradingLab"])assert.ok(css.includes(q));assert.match(css,/--nivora-body/);assert.match(css,/--nivora-section/);});
