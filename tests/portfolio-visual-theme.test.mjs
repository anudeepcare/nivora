import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(p, "utf8");
test("portfolio's scoped return and chart colors preserve series identity without red", () => {
  const s = read("components/PortfolioReference.module.css");
  assert.match(s, /--portfolio-basket: #354fb9/);
  assert.match(s, /--portfolio-spy: #087b70/);
  assert.match(s, /--portfolio-qqq: #864cab/);
  assert.match(s, /data-theme="dark"[^\n]*\{[^}]*--portfolio-basket: #9eafff/);
  assert.match(
    s,
    /:global\(\.negative\)\s*\{\s*color: var\(--portfolio-loss\)/,
  );
  assert.match(s, /\.snapshot\s*\{[^}]*background: none/s);
  const actual = read("components/AccountHistory.tsx");
  assert.match(actual, /var\(--portfolio-spy/);
  assert.match(actual, /var\(--portfolio-qqq/);
});
test("holdings lens discloses the SPY comparison as same-date percentage points rather than account return", () => {
  const s = read("components/ApprovedPortfolioChart.tsx");
  assert.match(s, /priceChangeGap\(chart.points, spy.points\)/);
  assert.match(s, /percentage points/);
  assert.match(s, /behind/);
  assert.match(s, /ahead of/);
});
