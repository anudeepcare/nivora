import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("holdings chart uses stable series identity instead of red/green performance color", () => {
  const css = fs.readFileSync("components/PortfolioChart.module.css", "utf8");
  assert.doesNotMatch(css, /svg\[data-direction=/);
  assert.match(css, /--holdings-series: var\(--portfolio-basket, #354fb9\)/);
  assert.match(css, /--spy-series: var\(--portfolio-spy, #087b70\)/);
  assert.match(css, /--qqq-series: var\(--portfolio-qqq, #864cab\)/);
  assert.match(css, /data-theme="dark"/);
  assert.match(css, /color: var\(--holdings-series\)/);
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(s, /data-benchmark="HOLDINGS"/);
  assert.match(s, /"8 4" : "2 4"/);
  assert.match(s, /stopOpacity="\.12"/);
  assert.match(s, /aria-valuetext=/);
  assert.match(s, /onKeyDown=/);
});
