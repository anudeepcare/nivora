import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
const read = (file) => fs.readFileSync(`components/${file}`, "utf8");
test("Business period header and the leading evidence keep one compact vertical rhythm", () => {
  const css = read("FinancialPicture.module.css");
  assert.match(css, /section\[aria-label="The business in 30 seconds"\]/);
  assert.match(css, /gap: 10px/);
  for (const value of ["ttm", "annual", "quarterly"])
    assert.ok(read("FinancialPicture.tsx").includes(`"${value}"`));
});
test("Technical chart disclosures keep real values on the chart plane and quiet labelled controls", () => {
  const css = read("ResearchMetrics.module.css");
  assert.match(
    css,
    /\.technicalChart[\s\S]*details:has\(\[aria-label="Chart references"\]\)/,
  );
  assert.match(css, /:global\(summary\)\s*\{\s*background: transparent/);
  assert.match(css, /:global\(\.plot-section > \.signal-chart-tools\)/);
  const chart = read("PriceStudyChart.tsx");
  assert.match(chart, /<StockFacts research=\{research\} priceContext \/>/);
  assert.match(chart, /<PriceChart/);
});
