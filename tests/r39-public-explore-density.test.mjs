import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import postcss from "postcss";

const source = fs.readFileSync(
  "components/PublicPlaidOpening.module.css",
  "utf8",
);
const css = postcss.parse(source);
function props(selector, media) {
  const result = {};
  css.walkRules(selector, (r) => {
    if (
      r.selector === selector &&
      (media ? r.parent.params === media : r.parent.type === "root")
    )
      r.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
}
test("Explore destinations keep intrinsic row height independently of the side preview", () => {
  assert.equal(props(".links")["align-content"], "start");
  assert.equal(props(".links")["grid-auto-rows"], "max-content");
  assert.equal(props(".links a")["min-height"], "56px");
  assert.equal(props(".featured .preview")["margin"], "8px 0");
  assert.equal(props(".featured .range")["margin"], "9px 0");
});
test("phone menu remains scrollable with touch-sized links", () => {
  const media = "(max-width: 760px)";
  assert.equal(props(".mega", media)["overflow-y"], "auto");
  assert.equal(props(".categories button", media)["min-height"], "44px");
  assert.ok(parseInt(props(".links a", media)["min-height"], 10) >= 44);
});
