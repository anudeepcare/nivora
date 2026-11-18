import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("followed prices remain directly visible once, with full watchlist access retained", () => {
  const source = readFileSync("components/HomeWorkspace.tsx", "utf8");
  const cards = readFileSync("components/HomeMarketCards.tsx", "utf8");
  assert.equal((source.match(/<HomeMarketCards\b/g) || []).length, 1);
  assert.match(source, /<HomeMarketCards\s+symbols=\{symbols\}\s+quotes=\{quotes.data\}/);
  assert.doesNotMatch(source, /<summary>Followed company prices<\/summary>|<HomeCompany/);
  assert.match(cards, /href=\{`\$\{prefix\}\/watchlist`\} className=\{styles.explore\}/);
  assert.match(cards, /View all followed companies/);
  assert.match(cards, /Followed company trends/);
  assert.doesNotMatch(cards, /<details/);
});
