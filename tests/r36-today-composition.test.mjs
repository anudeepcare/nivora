import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const jsx = readFileSync("components/HomeWorkspace.tsx", "utf8");
const css = readFileSync("components/HomeWorkspace.module.css", "utf8");

test("Today opens with research priorities and dated events, ahead of price and account context", () => {
  assert.ok(
    jsx.indexOf('aria-label="Today’s story"') <
      jsx.indexOf('id="home-earnings"'),
  );
  assert.ok(
    jsx.indexOf('id="home-earnings"') < jsx.indexOf('title="What changed"'),
  );
  assert.ok(jsx.indexOf('title="What changed"') < jsx.indexOf("<PortfolioDay"));
  assert.match(jsx, /<PortfolioDay\s+compact/);
  assert.equal(jsx.match(/<HomeQuarterHighlights/g)?.length, 1);
});

test("Today keeps the original coverage behavior inside its quiet inline affordance", () => {
  assert.match(
    jsx,
    /className=\{homeStyles.quoteStatus\}[\s\S]+<Coverage state=/,
  );
  assert.match(
    css,
    /\.quoteStatus :global\(\.approved-data-note\)[^{]*\{[^}]*background: transparent/s,
  );
});
