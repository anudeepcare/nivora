import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("holding identity summarizes shares inline",()=>{const x=read("app/portfolio/page.tsx");assert.match(x,/v6523HoldingMeta/);assert.match(x,/shares · Avg/);});
test("empty thesis and opportunity pills are hidden",()=>{const x=read("app/portfolio/page.tsx");assert.match(x,/hasThesis/);assert.match(x,/hasOpportunity/);});
test("holding actions use compact overflow control",()=>{const x=read("app/portfolio/page.tsx");assert.match(x,/v6523Overflow/);assert.match(x,/MoreHorizontal/);});
test("mobile holdings have editorial hierarchy",()=>{const x=read("app/globals.css");assert.match(x,/V65\.23[\s\S]*\.v65Position\{[^}]*padding:18px!important/s);assert.match(x,/\.v6523PrimaryValue\{[^}]*font-size:22px!important/s);});
test("analyze metrics use refined typography",()=>{const x=read("app/globals.css");assert.match(x,/\.v65MetricStrip \.metricLabel\{[^}]*letter-spacing:\.055em!important/s);assert.match(x,/\.v65MetricStrip \.metricValue\{[^}]*font-weight:720!important/s);});
