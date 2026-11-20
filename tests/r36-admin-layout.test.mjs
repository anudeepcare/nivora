import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(`components/${p}`, "utf8");
test("owner controls use one open rail, without a decorative title capsule", () => {
  const css = read("OwnerAccess.module.css");
  assert.match(
    css,
    /\.root\[data-plaid-page="owner"\] > \.heading\s*\{[^}]*background: transparent/,
  );
  assert.match(css, /membership-panel[\s\S]*inline-size: 100%/);
  const jsx = read("OwnerAccess.tsx");
  for (const value of ["owner", "free", "pro"])
    assert.match(jsx, new RegExp(`<option value="${value}">`));
});
test("handbook uses one full-width reader and one shared chapter selector, retaining download and detail", () => {
  const jsx = read("OwnerHandbook.tsx");
  assert.doesNotMatch(jsx, /aria-label="Guide topics"|id="admin-handbook"/);
  assert.match(jsx, /aria-label="Chapter"/);
  assert.match(
    jsx,
    /onChange=\{\(e\) => chooseChapter\(Number\(e.target.value\)\)\}/,
  );
  assert.match(jsx, /onClick=\{download\}/);
  assert.match(jsx, /Full explanation & technical details/);
  assert.match(
    read("OwnerHandbook.module.css"),
    /\.root\.root \.reader article\s*\{[^}]*max-width: none/,
  );
});
