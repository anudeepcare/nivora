import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const css = postcss.parse(
  fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
);
function final(selector, prop) {
  let value;
  css.walkRules((r) => {
    if (r.selector === selector) r.walkDecls(prop, (d) => (value = d.value));
  });
  return value;
}
test("dock has one border-box height and safe area allocation with fixed equal tracks", () => {
  assert.equal(final(".shell .dock", "box-sizing"), "border-box");
  assert.equal(final(".shell .dock", "height"), "var(--mobile-dock-clearance)");
  assert.equal(
    final(".shell .dock", "grid-template-columns"),
    "repeat(5, minmax(0, 1fr))",
  );
  assert.equal(final(".shell .dock", "grid-template-rows"), "56px");
  assert.equal(final(".shell .dock", "gap"), "0");
  assert.equal(
    final('.shell[data-page="research"] .workspace', "padding-bottom"),
    "var(--mobile-dock-clearance)",
  );
  assert.equal(
    final('.shell[data-page="research"] .content', "padding-bottom"),
    "0",
  );
});
test("dock targets fit track and centered active marker without oversized underline", () => {
  assert.equal(final(".shell .dock :is(a, button)", "min-width"), "0");
  assert.equal(final(".shell .dock :is(a, button)", "height"), "56px");
  assert.equal(
    final('.shell .dock a[aria-current="page"]::after', "left"),
    "50%",
  );
  assert.equal(
    final('.shell .dock a[aria-current="page"]::after', "transform"),
    "translateX(-50%)",
  );
});
