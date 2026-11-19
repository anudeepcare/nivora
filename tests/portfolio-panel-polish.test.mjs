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
test("portfolio panels stretch together and center label stays inside donut hole", () => {
  const css = read("PortfolioReference.module.css");
  assert.match(css, /\.grid\s*\{[^}]*align-items:\s*stretch/s);
  assert.match(
    css,
    /\.capitalOverview > :global\(\.card\)\s*\{[^}]*flex:\s*1/s,
  );
  assert.match(css, /\.ring\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(css, /\.ring > div\s*\{[^}]*inset:\s*22%/s);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});
