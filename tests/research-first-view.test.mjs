import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (n) => fs.readFileSync("components/" + n + ".module.css", "utf8");
const d = (n, selector) => {
  const out = {};
  postcss.parse(read(n)).walkRules((r) => {
    if (r.selector === selector) r.walkDecls((x) => (out[x.prop] = x.value));
  });
  return out;
};
test("four business indicator cards fit one desktop row and remain responsive", () => {
  const css = read("ResearchLens");
  assert.match(css, /repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /max-width: 800px/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /max-width: 480px/);
});
test("transaction pills pair semantic text and background tokens for both themes", () => {
  for (const [action, tone] of [
    ["purchase", "green"],
    ["sale", "red"],
  ]) {
    const p = d("CongressDisclosures", `.row[data-action="${action}"] .action`);
    assert.equal(p.color, `var(--${tone})`);
    assert.equal(p.background, `var(--${tone}-soft)`);
  }
});
test("compact calendar preserves touch targets and natural surrounding page flow", () => {
  const css = read("ResearchVisualEvidence");
  assert.match(css, /pointer: coarse/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /overscroll-behavior: auto/);
  assert.doesNotMatch(css, /position: fixed/);
});
