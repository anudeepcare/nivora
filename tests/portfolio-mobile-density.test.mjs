import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const css = postcss.parse(
  fs.readFileSync("components/PortfolioComposition.module.css", "utf8"),
);
const get = (tail, prop) => {
  let v;
  css.walkRules((r) => {
    if (
      r.parent.type === "atrule" &&
      r.parent.params === "(max-width: 600px)" &&
      r.selector.endsWith(tail)
    )
      r.walkDecls(prop, (d) => (v = d.value));
  });
  return v;
};
test("phone holdings replace the wide table with readable rows, disclosure and touch targets", () => {
  assert.equal(get(".desktopHoldings", "display"), "none");
  assert.equal(get(".phoneHoldings", "display"), "block");
  assert.equal(
    get(".phoneLead", "grid-template-columns"),
    "minmax(0, 1fr) minmax(0, 1fr)",
  );
  assert.equal(get(".phoneDetails > summary", "min-height"), "44px");
  assert.equal(get(".phoneActions button", "min-height"), "44px");
  assert.equal(
    get(".phoneHoldings :focus-visible", "outline"),
    "2px solid var(--plaid-focus, var(--blue))",
  );
});
