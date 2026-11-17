import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const view = fs.readFileSync(
  new URL("../components/Session.tsx", import.meta.url),
  "utf8",
);
const css = fs.readFileSync(
  new URL("../components/Session.module.css", import.meta.url),
  "utf8",
);
test("login uses reference composition without pretending illustration is live market evidence", () => {
  for (const text of [
    "YOUR RESEARCH, CONTINUED",
    "Return to the reasons behind every position.",
    "Sign in to Auryn",
    "Create your workspace",
  ])
    assert.ok(view.includes(text));
  assert.ok(!view.includes("APP entered your P4 zone"));
  assert.ok(view.includes("auth.signInWithPassword"));
  assert.ok(view.includes("auth.signUp"));
  assert.ok(view.includes("auth.resetPasswordForEmail"));
});
test("login remains vertically accessible and explicitly owns form layout", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*58fr\) minmax\(0,\s*42fr\)/);
  assert.match(css, /height:\s*auto/);
  assert.match(css, /overflow:\s*visible/);
  assert.match(css, /\.mp-auth-form\)[\s\S]*?display:\s*block/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /safe-area-inset-bottom/);
});
test("login theme control uses shared preference and accessible label", () => {
  assert.ok(view.includes('auryn-product-theme", next'));
  assert.ok(
    view.includes('Use ${loginTheme === "dark" ? "day" : "night"} theme'),
  );
});
