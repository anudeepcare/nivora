import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) =>
  postcss.parse(fs.readFileSync(`components/${p}.module.css`, "utf8"));
// Count class/pseudo-class specificity, treating CSS-module :global as a wrapper only.
const specificity = (s) =>
  (
    s
      .replace(/:global\(([^)]+)\)/g, "$1")
      .match(/\.[\w-]+|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []
  ).length;
test("phone composition hides the desktop ledger independent of import order", () => {
  const current = read("PortfolioComposition"),
    legacy = read("PortfolioWorkspace");
  let chosen;
  let defaultPhone;
  let narrowPhone;
  current.walkRules((r) => {
    if (r.selector === ".phoneHoldings" && r.parent.type === "root")
      defaultPhone = r;
    if (r.parent.type !== "atrule" || r.parent.params !== "(max-width: 600px)")
      return;
    if (r.selector.endsWith(" .desktopHoldings")) chosen = r;
    if (r.selector === ".phoneHoldings") narrowPhone = r;
    assert.doesNotMatch(r.selector, /(?:^|\s)(?:td|tr|table)(?:\b|:)/);
  });
  const display = (rule) =>
    rule?.nodes.find((d) => d.prop === "display")?.value;
  assert.equal(display(chosen), "none");
  assert.equal(display(defaultPhone), "none");
  assert.equal(display(narrowPhone), "block");
  legacy.walkRules((r) => {
    for (const selector of r.selector.split(",")) {
      if (selector.trim().endsWith(".ledger") && display(r))
        assert.ok(
          specificity(chosen.selector) > specificity(selector),
          `${chosen.selector} must beat ${selector}`,
        );
    }
  });
});
