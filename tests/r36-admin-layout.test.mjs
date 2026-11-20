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
test("handbook uses one measured reader and a mobile chapter selector, retaining download and document text", () => {
  const jsx = read("OwnerHandbook.tsx");
  assert.doesNotMatch(jsx, /aria-label="Guide topics"|id="admin-handbook"/);
  assert.match(jsx, /aria-label="Chapter"/);
  assert.match(
    jsx,
    /onChange=\{\(e\) => chooseChapter\(Number\(e.target.value\), false\)\}/,
  );
  assert.match(jsx, /onClick=\{download\}/);
  assert.match(jsx, /handbookBlocks\(active\?\.body/);
  assert.match(jsx, /<div className=\{styles.body\}/);
  assert.match(
    read("OwnerHandbook.module.css"),
    /\.reader article\s*\{[^}]*max-width: 74ch/,
  );
});
