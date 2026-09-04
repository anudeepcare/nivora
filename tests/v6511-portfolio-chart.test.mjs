import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=()=>fs.readFileSync("components/portfolio/PortfolioPerformanceChart.tsx","utf8");
test("performance chart supports portfolio SPY QQQ toggles and accessible SVG",()=>{const x=s();assert.match(x,/PORTFOLIO/);assert.match(x,/SPY/);assert.match(x,/QQQ/);assert.match(x,/<svg/);assert.match(x,/aria-label="Portfolio performance chart"/);});
test("chart refuses to draw fake history with fewer than two points",()=>{const x=s();assert.match(x,/points\.length<2/);assert.match(x,/Not enough exact history/);});
