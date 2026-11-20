import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import postcss from "postcss";

const view = fs.readFileSync("components/Session.tsx", "utf8");
test("account entry uses one compact toolbar and no competing marketing area", () => {
  const toolbar = view.match(
    /<header className=\{experience\.accessBar\} data-auth-banner>([\s\S]*?)<\/header>/,
  )?.[1];
  assert.ok(toolbar);
  for (const control of ["AURYN", "themeToggle"])
    assert.ok(toolbar.includes(control));
  assert.doesNotMatch(view, /storyContent|researchCard|WELCOME BACK/);
  assert.match(
    view,
    /<details className=\{experience\.rememberHelp\}>[\s\S]*?Browser restore can/,
  );
  for (const control of [
    "Continue with Google",
    "auryn-signin-email",
    "auryn-signin-password",
    "mp-form-submit",
  ])
    assert.ok(view.includes(control));
});
test("auth frame flows at small heights and preserves safe area and normal scrolling", () => {
  const css = postcss.parse(
    fs.readFileSync("components/SessionAccess.css", "utf8"),
  );
  const declarations = {};
  css.walkRules('.mp-auth[data-plaid-page="access"]', (rule) =>
    rule.walkDecls((d) => (declarations[d.prop] = d.value)),
  );
  assert.equal(declarations["min-height"], "100svh");
  assert.equal(declarations.height, "auto");
  assert.equal(declarations.overflow, "visible");
  assert.match(declarations.padding, /safe-area-inset-bottom/);
  assert.equal(declarations["align-content"], "start");
});
