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
test("phone composition outranks legacy ledger cell placement independent of import order", () => {
  const current = read("PortfolioComposition"),
    legacy = read("PortfolioWorkspace");
  for (const tail of [
    "tr",
    "td",
    "td:first-child",
    "td:nth-child(2)",
    "td:nth-child(3)",
    "td:nth-child(4)",
    "td:last-child",
  ]) {
    let chosen;
    current.walkRules((r) => {
      if (
        r.parent.type === "atrule" &&
        r.parent.params === "(max-width: 600px)" &&
        r.selector.endsWith(" " + tail)
      )
        chosen = r;
    });
    assert.ok(chosen, tail);
    legacy.walkRules((r) => {
      for (const selector of r.selector.split(",")) {
        if (
          selector.includes(".ledger") &&
          selector.trim().endsWith(" " + tail)
        )
          assert.ok(
            specificity(chosen.selector) > specificity(selector),
            `${chosen.selector} must beat ${selector}`,
          );
      }
    });
  }
  const rules = [];
  current.walkRules((r) => rules.push(r));
  const get = (tail, prop) =>
    rules
      .filter((r) => r.selector.endsWith(" " + tail))
      .flatMap((r) => r.nodes)
      .filter((d) => d.prop === prop)
      .at(-1)?.value;
  assert.equal(get("td:last-child", "grid-row"), "4");
  assert.equal(get("td:last-child", "justify-self"), "stretch");
  assert.equal(get("td", "grid-template-columns"), "none");
  assert.equal(get("td:nth-child(4)", "display"), "block");
  assert.equal(get("td:nth-child(4)", "grid-row"), "1");
  assert.equal(get("td:nth-child(5)", "grid-row"), "2");
  assert.equal(get("td:nth-child(5)", "grid-column"), "2");
  assert.equal(
    get("tr", "grid-template-columns"),
    "minmax(0, 1fr) minmax(0, 1fr)",
  );
});
