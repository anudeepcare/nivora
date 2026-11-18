import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("history leads portfolio and names its supported comparison before setup", () => {
  const p = read("PortfolioPage.tsx"),
    h = read("AccountHistory.tsx");
  assert.ok(
    p.indexOf("<AccountHistory") < p.indexOf('title="Capital allocation"'),
  );
  assert.match(h, /S&P 500 \(SPY\)/);
  assert.match(h, /Nasdaq-100 \(QQQ\)/);
  assert.match(h, /Crypto and\s+non-US instruments\s+are not supported/);
});
test("benchmark summaries expose missing evidence and distinguish hypothetical balances", () => {
  const s = read("AccountHistory.tsx");
  assert.match(s, /styles.comparisonSummary/);
  assert.match(s, /benchmark.reason/);
  assert.match(s, /Hypothetical balance/);
  assert.match(s, /No comparison result supplied/);
  assert.match(s, /styles.legend/);
  assert.match(s, /disabled=\{!confirmed \|\| !reviewed \|\| busy\}/);
});
