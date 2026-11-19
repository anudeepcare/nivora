import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const ast = postcss.parse(
  fs.readFileSync("components/PortfolioWorkspace.module.css", "utf8"),
);
function rule(s) {
  const result = {};
  ast.walkRules(s, (r) => {
    if (r.parent.params === "(max-width: 767px)")
      r.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
}
test("phone holdings title and refresh occupy distinct full-width rows", () => {
  const grid = rule(".portfolio.portfolio .holdingsToolbar");
  assert.equal(grid["grid-template-columns"], "minmax(0, 1fr)");
  const title = rule(".portfolio.portfolio .holdingsToolbar > h2"),
    refresh = rule(".portfolio.portfolio .holdingsToolbar > .refreshControls");
  assert.equal(title["grid-row"], "1");
  assert.equal(refresh["grid-row"], "2");
  assert.equal(title["grid-column"], refresh["grid-column"]);
  assert.equal(title["white-space"], "normal");
  assert.equal(title["min-width"], "0");
});
test("phone search, pace and column controls keep independent rows and all handlers", () => {
  for (const [selector, row] of [
    [".holdingsSearch", "3"],
    ["select", "4"],
    ["button", "5"],
  ])
    assert.equal(
      rule(`.portfolio.portfolio .holdingsToolbar > ${selector}`)["grid-row"],
      row,
    );
  const s = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  for (const label of [
    "Portfolio price refresh interval",
    "Refresh portfolio prices",
    "Filter holdings",
    "Columns & metrics",
  ])
    assert.ok(s.includes(label));
  assert.match(s, /onClick=\{quotes.refresh\}/);
});
