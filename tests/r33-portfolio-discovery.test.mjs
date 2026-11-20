import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(`components/${p}`, "utf8");
test("Compare keeps contribution calculator available in a concise optional workspace", () => {
  const s = read("SupportingViews.tsx");
  assert.match(s, /<details className=\{compareStyles.contribution\}>/);
  assert.match(s, /<summary>Test your next addition<\/summary>/);
  assert.match(s, /<ContributionCompare/);
});
test("Discover retains sector map as optional context, without stacking two open charts", () => {
  const s = read("Discover.tsx");
  assert.match(
    s,
    /<summary>Sector map &amp; relative opportunities<\/summary>/,
  );
  assert.match(s, /<DiscoveryPlot/);
  assert.match(s, /<OpportunityMap/);
  assert.match(s, /<MarketRadar/);
});
test("Mobile financial workspaces constrain controls and retain touch-sized actions", () => {
  const s = read("PlaidDiscovery.module.css");
  assert.match(s, /min-width: 0/);
  assert.match(s, /max-width: 480px/);
  assert.match(s, /overflow-wrap: anywhere/);
  assert.match(
    read("PortfolioReference.module.css"),
    /--portfolio-loss: var\(--plaid-violet/,
  );
  assert.match(read("StockScreener.module.css"), /font-size: 16px/);
});
