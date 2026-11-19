import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) => fs.readFileSync(`components/${name}`, "utf8");
test("Portfolio uses separate mock cards with one chart and no enclosing summary frame", () => {
  const page = read("PortfolioPage.tsx"),
    css = read("PortfolioReference.module.css");
  assert.match(
    page,
    /<WealthStrip state=\{state\} portfolio className=\{reference.snapshot\} \/>/,
  );
  assert.ok(page.indexOf("<WealthStrip") < page.indexOf("<AccountHistory"));
  assert.equal((page.match(/<AccountHistory\b/g) ?? []).length, 1);
  assert.match(page, /className=\{reference.history\}/);
  assert.match(
    css,
    /\.snapshot\s*\{[^}]*padding: 0[^}]*border: 0[^}]*background: none/s,
  );
  assert.match(
    css,
    /\.snapshot > div\s*\{[^}]*border: 1px solid var\(--line\)/s,
  );
});
test("holding basis note follows instead of pushing the visible time-series down", () => {
  const s = read("ApprovedPortfolioChart.tsx");
  assert.ok(s.indexOf("className={styles.chartCaption}") > s.indexOf("</svg>"));
  assert.match(s, /Price-only\s+snapshot, not account return/);
  const a = read("AccountHistory.tsx");
  assert.match(a, /<h2>Portfolio history<\/h2>/);
  assert.doesNotMatch(a, /Compare against SPY and QQQ after recording/);
});
