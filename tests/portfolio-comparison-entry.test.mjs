import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const p = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
test("portfolio shares one direct transaction dialog between the toolbar and history", () => {
  assert.match(p, /onClick=\{openTransaction\}[\s\S]{0,150}Record transaction/);
  assert.match(p, /<AccountHistory\b[^>]*onReviewRecords=\{openTransaction\}/s);
  assert.match(p, /<TransactionWorkspace\b[^>]*\bdirectRecord\b/s);
  assert.doesNotMatch(
    p,
    /comparisonSetup|comparisonFirst|Set up your market comparison/,
  );
});
test("each holding can add a lot without opening its purchase list", () => {
  const action = p.match(
    /aria-label=\{\x60Add purchase for \$\{p\.symbol\}\x60\}([\s\S]*?)<\/button>/,
  );
  assert.ok(action);
  assert.match(action[1], /onAddPurchase\(/);
  assert.doesNotMatch(action[1], /showModal/);
  assert.match(p, /Manage \$\{p\.symbol\} purchases/);
});
