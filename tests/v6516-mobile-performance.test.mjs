import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const x=fs.readFileSync("app/globals.css","utf8");
test("mobile typography stays readable",()=>{assert.match(x,/\.stockPage \.metricLabel small\{font-size:12px!important/);assert.match(x,/\.stockPage \.v65MetricValue,\.stockPage \.v65SnapshotGrid b\{font-size:27px!important/)});
test("mobile avoids broad expensive glass blur",()=>{assert.match(x,/\.stockPage \.portfolioGlass,\.stockPage \[class\*="Glass"\]\{backdrop-filter:none!important;-webkit-backdrop-filter:none!important\}/)});
