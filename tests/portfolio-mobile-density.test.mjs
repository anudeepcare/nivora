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
test("phone holdings retain compact secondary fields and full size purchase controls", () => {
  assert.equal(get(".mobileHoldings tr", "gap"), "4px 12px");
  assert.equal(get(".mobileHoldings tr", "padding"), "12px 0");
  assert.equal(
    get(".mobileHoldings td[data-label]::before", "display"),
    "inline",
  );
  assert.equal(
    get(".mobileHoldings td:last-child button", "min-height"),
    "44px",
  );
  assert.equal(
    get(".mobileHoldings td:last-child button", "min-width"),
    "44px",
  );
  assert.equal(
    get(".mobileHoldings td:nth-child(4) > strong", "font-size"),
    "17px",
  );
});
