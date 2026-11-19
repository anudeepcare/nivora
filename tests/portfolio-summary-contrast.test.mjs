import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const css = (name) => fs.readFileSync(`components/${name}.module.css`, "utf8");
test("Portfolio uses one summary stylesheet so foreground and surface cannot cascade apart", () => {
  assert.doesNotMatch(css("PortfolioWorkspace"), /wealth-strip\.four/);
  const ast = postcss.parse(css("PortfolioReference"));
  const first = [];
  ast.walkRules((r) => {
    if (
      r.selector.includes("wealth-strip.four") &&
      r.selector.endsWith("div:first-child")
    )
      first.push(r);
  });
  assert.equal(first.length, 1);
  const f = Object.fromEntries(
    first[0].nodes
      .filter((d) => d.type === "decl")
      .map((d) => [d.prop, d.value]),
  );
  assert.equal(f.color, "var(--ink)");
  assert.ok(
    !f["--ink"] && !f["--muted"],
    "do not force a light palette on a theme-owned card",
  );
});
test("Portfolio chart artwork is not recolored by the workspace's legacy direction selectors", () => {
  assert.doesNotMatch(
    css("PortfolioWorkspace"),
    /approved-portfolio-chart\[data-direction/,
  );
});
