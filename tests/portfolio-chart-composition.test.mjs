import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("compact chart puts toolbar and unified live readout before plot, supporting notes after", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(s, /className=\{styles.chartToolbar\}/);
  assert.match(s, /className=\{styles.seriesReadout\}/);
  assert.ok(s.indexOf("styles.seriesReadout") < s.indexOf("<svg"));
  assert.ok(s.indexOf("styles.chartCaption") > s.indexOf("</svg>"));
  assert.match(
    s,
    /!compact && chart.points.length > 1 && \(\s*<div\s+className=\{styles.inspection\}/,
  );
});

test("percentage axis uses readable round ticks covering both endpoints and zero", async () => {
  const { portfolioPercentScale } = await import("../lib/portfolio-plot.ts");
  assert.deepEqual(portfolioPercentScale(-42, 22), {
    min: -60,
    max: 40,
    ticks: [-60, -40, -20, 0, 20, 40],
  });
  assert.deepEqual(portfolioPercentScale(0, 0), {
    min: -1,
    max: 1,
    ticks: [-1, 0, 1],
  });
  assert.ok(portfolioPercentScale(-0.3, 0.26).ticks.length < 9);
});
