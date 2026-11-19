import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("portfolio history and allocation form a 3-to-1 desktop row", () => {
  const rules = postcss
    .parse(read("PortfolioReference.module.css"))
    .nodes.filter((n) => n.type === "rule" && n.selector === ".grid");
  assert.ok(
    rules[0].nodes.some(
      (n) =>
        n.prop === "grid-template-columns" &&
        n.value === "minmax(0, 3fr) minmax(260px, 1fr)",
    ),
  );
  assert.ok(
    rules[0].nodes.some(
      (n) => n.prop === "align-items" && n.value === "stretch",
    ),
  );
});
test("chart, allocation and holdings stack on narrow screens", () => {
  const css = read("PortfolioReference.module.css");
  assert.match(
    css,
    /\.history,\s*\.capitalOverview,\s*\.holdings\s*\{[^}]*min-width:\s*0/,
  );
  assert.match(css, /\.grid > \.capitalOverview\s*\{[^}]*grid-column:\s*2/);
  assert.match(
    css,
    /@media \(max-width: 860px\)\s*\{\s*\.grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/,
  );
});
test("summary surfaces never force inverse green cards or private text tokens", () => {
  const css = postcss.parse(read("PortfolioWorkspace.module.css"));
  css.walkRules((rule) => {
    if (
      !rule.selector.includes(".wealth-strip.four") ||
      !rule.selector.includes("first-child")
    )
      return;
    rule.walkDecls((d) => {
      assert.ok(
        !["--ink", "--muted", "--line", "--green", "--red"].includes(d.prop),
        d.prop,
      );
      if (d.prop === "background") assert.equal(d.value, "var(--card)");
    });
  });
});
test("review rows have neutral surfaces, preserving semantic action icons", () => {
  const css = read("DecisionAttention.module.css");
  assert.doesNotMatch(css, /color-mix\(in srgb, var\(--green\) 6%/);
  assert.match(css, /\.identity > svg\s*\{[^}]*color: var\(--green\)/s);
});
