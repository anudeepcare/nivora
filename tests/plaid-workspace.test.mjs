import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (name) =>
  fs.readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");
test("Today puts events first and retains one compact portfolio summary and stock context", () => {
  const source = read("HomeWorkspace.tsx");
  assert.ok(
    source.indexOf("<PortfolioDay") > source.indexOf('id="home-earnings"'),
  );
  assert.ok(
    source.indexOf("<HomeMarketCards") > source.indexOf('id="home-earnings"'),
  );
  assert.equal(source.match(/<PortfolioDay\b/g)?.length, 1);
  assert.equal(source.match(/<HomeMarketCards\b/g)?.length, 1);
  assert.match(source, /className={homeStyles.leadGrid}/);
  assert.doesNotMatch(source, /<PaceBoard/);
  assert.match(source, /scanPace: false/);
  assert.match(source, /<ContributionCompare/);
});
test("Plaid workspace compositions are theme aware, responsive and have readable numeric hierarchy", () => {
  for (const name of [
    "HomeWorkspace.module.css",
    "PortfolioReference.module.css",
  ]) {
    const css = read(name);
    assert.doesNotThrow(() => postcss.parse(css));
    assert.match(css, /var\(--plaid-ink/);
    assert.match(css, /var\(--plaid-card-blue/);
    assert.match(css, /var\(--plaid-focus/);
    assert.match(css, /font-variant-numeric:\s*tabular-nums/);
    assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  }
});
test("Portfolio preserves account history, benchmark context, transactions and full-width holdings", () => {
  const source = read("PortfolioPage.tsx");
  assert.match(source, /<AccountHistory/);
  assert.match(source, /currentHoldingsHistory=/);
  assert.match(source, /<ApprovedPortfolioChart/);
  assert.match(source, /Record transaction/);
  assert.match(source, /Cash &amp; balances/);
  assert.match(
    read("PortfolioReference.module.css"),
    /grid-column:\s*1\s*\/\s*-1/,
  );
  assert.match(
    read("PortfolioReference.module.css"),
    /--red:\s*var\(--portfolio-loss\)/,
  );
});
