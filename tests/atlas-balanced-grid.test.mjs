import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Atlas uses balanced zero-minimum tracks and all six actual metric tiles stay in a phone grid", () => {
  const css = fs.readFileSync("components/ReferenceAtlas.module.css", "utf8");
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(
    css,
    /\.tape\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  const action = css.slice(
    css.indexOf(".action button {"),
    css.indexOf(".action > small"),
  );
  assert.match(action, /color: var\(--atlas-ink\)/);
  assert.match(action, /background: var\(--atlas-panel\)/);
  assert.doesNotMatch(action, /#79eadc/);
  const source = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(source, /value: percent\(b.businessNumbers.dilution\)/);
  assert.match(source, /Comparable reported periods; not a price return/);
});

test("Atlas price chart uses the same outer gutter rather than double horizontal padding", () => {
  const css = fs.readFileSync("components/ReferenceCockpit.module.css", "utf8");
  assert.match(css, /\.primaryChart\s*\{[\s\S]*?margin: 16px 0/);
  assert.match(css, /padding: 16px var\(--research-gutter\)/);
});
