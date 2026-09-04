import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Pulse has contribution drivers and risk visualization",()=>{const s=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");assert.match(s,/What drove your money/);assert.match(s,/pulseDriverBar/);assert.match(s,/Risk &amp; concentration/);});
test("portfolio sizing language never overwrites company action",()=>{const s=fs.readFileSync("lib/v65/portfolio.ts","utf8");assert.match(s,/companyAction:raw/);assert.match(s,/portfolioAction/);assert.match(s,/TRIM_RISK/);});
