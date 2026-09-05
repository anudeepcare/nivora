import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const p=fs.readFileSync("app/portfolio/page.tsx","utf8"),c=fs.readFileSync("app/globals.css","utf8");
test("current price renders one dollar sign",()=>assert.match(p,/v6523Current[\s\S]*?<b>\{`\$\$\{price/s));
test("mobile analyze metric labels and values are readable",()=>{assert.match(c,/V65\.24[\s\S]*\.v65MetricStrip \.metricLabel\{[^}]*font-size:12px!important/s);assert.match(c,/\.v65MetricStrip \.metricValue\{[^}]*font-size:28px!important/s)});
test("thesis mobile body typography is readable",()=>{assert.match(c,/\.v6516ThesisCard p\{[^}]*font-size:16px!important/s);assert.match(c,/\.v6516ScoreDescription\{[^}]*font-size:14px!important/s)});
test("thesis tabs remain legible",()=>assert.match(c,/\.v6516ThesisTabs button\{[^}]*font-size:13px!important/s));
