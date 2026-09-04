import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const css=fs.readFileSync("app/globals.css","utf8");
test("mobile navigation has restrained glass treatment and readable labels",()=>{assert.match(css,/\.v65MobileNav\{[^}]*backdrop-filter:blur\(18px\)/s);assert.match(css,/@media\(max-width:620px\)[\s\S]*\.v65MobileNav[^}]*font-size:12px/s)});
test("trading lab explicitly receives larger mobile metrics",()=>{assert.match(css,/@media\(max-width:620px\)[\s\S]*\.tradingLab[\s\S]*font-size:15px/s)});
test("Analyze and Portfolio receive readable mobile metric values",()=>{assert.match(css,/\.stockPage[\s\S]*\.portfolioPage/);assert.match(css,/--nivora-mobile-body:15px/)});
