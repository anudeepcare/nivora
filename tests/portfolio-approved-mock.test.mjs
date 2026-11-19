import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("approved graph hierarchy uses short named lenses and compact method disclosure", () => {
  const a = fs.readFileSync("components/AccountHistory.tsx", "utf8");
  assert.match(a, />\s*Holdings prices\s*</);
  assert.match(a, />\s*Actual account\s*</);
  const c = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(c, /Data &amp; method/);
  assert.match(c, /styles.windowGap/);
  assert.match(c, /styles.endpointValue/);
  assert.match(c, /const plotHeight/);
});
