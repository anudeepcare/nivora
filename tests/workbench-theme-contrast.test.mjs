import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("expectation controls and benchmark rows use paired theme-neutral foregrounds and fills", () => {
  const source = fs.readFileSync(
    "components/ProfessionalWorkbench.tsx",
    "utf8",
  );
  const css = fs.readFileSync(
    "components/ProfessionalWorkbench.module.css",
    "utf8",
  );
  assert.match(source, /className=\{styles.modelSelector\}/);
  assert.doesNotMatch(source, /className="au-segment"/);
  assert.match(source, /context-workbench \$\{styles.marketContext\}/);
  assert.match(
    css,
    /button\[aria-pressed="true"\][\s\S]*color: var\(--surface\);[\s\S]*background: var\(--ink\)/,
  );
  assert.match(css, /tbody :is\(th, td\)[\s\S]*color: var\(--ink\)/);
  assert.match(
    css,
    /tbody tr:hover[\s\S]*color-mix\(in srgb, var\(--ink\) 8%, var\(--surface\)\)/,
  );
  assert.doesNotMatch(css, /blue-soft|#[0-9a-f]{3,8}/i);
  assert.match(css, /:focus-visible/);
});
