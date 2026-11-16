import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
// Auth can render before Product's lazy route CSS. All essential control
// geometry must therefore be available in Session's eagerly imported module.
const css = postcss.parse(
  fs.readFileSync("components/Session.module.css", "utf8"),
);
function declarations(selector) {
  const result = {};
  css.walkRules((rule) => {
    if (rule.selector === `.auth .main :global(${selector})`)
      rule.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
}
test("cold auth entry owns compact social icons without Product CSS", () => {
  const icon = declarations(".mp-social-button svg");
  assert.ok(
    parseFloat(icon.width) > 0 && parseFloat(icon.width) <= 24,
    "Social icon width must not fall back to the SVG default",
  );
  assert.ok(parseFloat(icon.height) > 0 && parseFloat(icon.height) <= 24);
  assert.equal(declarations(".mp-social-options").display, "grid");
  assert.equal(declarations(".mp-social-button").display, "flex");
});
test("cold auth entry owns form control layout without Product CSS", () => {
  assert.equal(declarations(".mp-password-field").position, "relative");
  assert.equal(
    declarations(".mp-password-field > button").position,
    "absolute",
  );
  assert.equal(declarations(".mp-form-submit").width, "100%");
  assert.equal(declarations(".mp-field-label").display, "flex");
  assert.equal(declarations(".mp-form-field").display, "flex");
  assert.ok(declarations(".mp-form-field input").border);
  assert.equal(declarations(".mp-form-divider").display, "flex");
  assert.equal(declarations(".mp-social-x-label").overflow, "hidden");
});

test("studio auth keeps theme-aware fields and a readable blue primary action", () => {
  const scopedPalette = [];
  css.walkDecls((decl) => {
    if (
      ["--ink", "--muted", "--line", "--bg", "--surface", "--card"].includes(
        decl.prop,
      )
    )
      scopedPalette.push(decl.prop);
  });
  assert.deepEqual(
    scopedPalette,
    [],
    "Auth fields must inherit the shared theme without redefining its tokens",
  );
  assert.equal(declarations(".mp-form-submit").background, "var(--blue)");
  assert.equal(declarations(".mp-form-submit").color, "white");
  assert.equal(declarations(".mp-social-button").background, "var(--card)");
});
