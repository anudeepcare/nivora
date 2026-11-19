import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("screener graphic only uses returned observations and preserves unknowns and observation table", () => {
  const s = fs.readFileSync("components/StockScreener.tsx", "utf8");
  assert.match(s, /Returned-set day changes/);
  assert.match(s, /not\s+market-wide breadth/);
  assert.match(s, /r\.changePercent === null/);
  assert.match(s, /rows\.slice\(0, 8\)/);
  assert.match(s, /Observed day change comparisons/);
  assert.match(s, /Price observation \(UTC\)/);
  assert.match(s, /changePercent === null \? null/);
  const css = fs.readFileSync("components/StockScreener.module.css", "utf8");
  assert.match(css, /\.comparisonBar/);
  assert.match(css, /@media.*620px/s);
});
