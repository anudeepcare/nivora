import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) => fs.readFileSync(`components/${name}`, "utf8");
test("Portfolio places one open time-series directly after unboxed values", () => {
  const page = read("PortfolioPage.tsx"),
    css = read("PortfolioReference.module.css");
  assert.match(
    page,
    /<WealthStrip state=\{state\} portfolio className=\{reference.snapshot\} \/>/,
  );
  const history = page.slice(
    page.indexOf("<WealthStrip"),
    page.indexOf("<AccountHistory"),
  );
  assert.match(history, /className=\{reference.history\}/);
  assert.doesNotMatch(history, /\bcard\b|reference.grid/);
  assert.match(
    css,
    /\.snapshot\s*\{[^}]*padding: 0[^}]*border: 0[^}]*background: none/s,
  );
  assert.match(
    css,
    /\.snapshot > div\s*\{[^}]*border: 0[^}]*background: none/s,
  );
});
test("holding basis note follows instead of pushing the visible time-series down", () => {
  const s = read("AccountHistory.tsx");
  const i = s.indexOf('displayHistory === "holdings")');
  const end = s.indexOf("// Keep missing", i);
  const view = s.slice(i, end);
  assert.match(view, /<h2>Portfolio history<\/h2>/);
  assert.ok(
    view.indexOf("{currentHoldingsHistory}") <
      view.indexOf("Not actual account performance"),
    "scope is below chart",
  );
  assert.doesNotMatch(view, /Compare against SPY and QQQ after recording/);
});
