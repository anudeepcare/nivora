import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (name) =>
  readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");
test("contribution disclosure has a scoped touch target and expanded indicator", () => {
  const source = read("ContributionCompare.tsx"),
    css = read("ContributionCompare.module.css");
  assert.match(source, /className=\{s\.toggle\}/);
  assert.match(source, /aria-controls=\{contentId\}/);
  assert.match(source, /id=\{contentId\}/);
  assert.match(css, /\.toggle\s*\{[^}]*min-height:\s*48px/s);
  assert.match(source, /<ChevronDown/);
});
test("comparison evidence footer aligns without hiding long reasons", () => {
  const source = read("ContributionCompare.tsx"),
    css = read("ContributionCompare.module.css");
  assert.match(source, /className=\{s\.footer\}/);
  assert.match(
    css,
    /\.grid article\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/s,
  );
  assert.match(css, /\.footer\s*\{[^}]*margin-top:\s*auto/s);
  assert.doesNotMatch(css, /line-clamp|text-overflow:\s*ellipsis/);
});
test("portfolio keeps the history outside the holdings and allocation grid", () => {
  const css = read("PortfolioReference.module.css");
  assert.match(
    css,
    /grid-template-columns: minmax\(0, 2\.12fr\) minmax\(250px, 1fr\)/,
  );
  assert.match(css, /\.grid > \.holdings\s*\{\s*grid-column: 1;/);
  assert.doesNotMatch(css, /\.grid > \.history/);
  assert.doesNotMatch(css, /\.ring/);
});
