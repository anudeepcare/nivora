import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const jsx = readFileSync("components/HomeWorkspace.tsx", "utf8");
const css = readFileSync("components/HomeMarketCards.module.css", "utf8");

test("Today opens with market and dated events, ahead of story and account context", () => {
  assert.ok(
    jsx.indexOf('id="home-earnings"') <
      jsx.indexOf('aria-label="Today’s story"'),
  );
  assert.ok(
    jsx.indexOf('id="home-earnings"') < jsx.indexOf('title="What changed"'),
  );
  assert.ok(
    jsx.indexOf('title="What changed"') <
      jsx.indexOf('aria-label="Workspace shortcuts"'),
  );
  assert.doesNotMatch(jsx, /<PortfolioDay/);
  assert.match(jsx, /href=\{[^\n]+\/portfolio/);
  assert.equal(jsx.match(/<HomeQuarterHighlights/g)?.length, 1);
});

test("Today keeps the original coverage behavior inside followed company quotes", () => {
  assert.match(
    jsx,
    /<HomeMarketCards[\s\S]+quoteContext=\{symbols.length \? <Coverage state=/,
  );
  assert.match(
    css,
    /\.quoteContext :global\(\.approved-data-note\)[^{]*\{[^}]*background: transparent/s,
  );
});
