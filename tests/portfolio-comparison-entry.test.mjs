import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("comparison action opens a dedicated setup dialog, not unrelated full-picture analysis", () => {
  const p = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  const action = p.slice(
    p.indexOf("onReviewRecords="),
    p.indexOf("<div className={reference.capitalOverview}"),
  );
  assert.match(action, /comparisonSetup.current\?\.showModal\(\)/);
  assert.doesNotMatch(action, /depth.current/);
  assert.match(p, /aria-labelledby="comparison-setup-title"/);
  assert.match(p, /<TransactionWorkspace[^>]*comparisonFirst/s);
});
test("comparison-first transaction flow exposes prerequisites and only saved-ledger build controls", () => {
  const p = fs.readFileSync("components/TransactionWorkspace.tsx", "utf8");
  assert.match(p, /comparisonFirst = false/);
  assert.match(p, /useState\(comparisonFirst\)/);
  assert.match(p, /open=\{historyOpen\}/);
  assert.match(p, /complete saved ledger across all accounts/);
  assert.match(p, /resource.data\?\.rows.length/);
  assert.match(p, /Save or finish reviewing/);
});
