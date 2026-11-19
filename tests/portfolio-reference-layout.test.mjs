import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../components/PortfolioPage.tsx", import.meta.url),
  "utf8",
);
test("portfolio reference hierarchy preserves real positions and transaction controls", () => {
  assert.match(source, /title="Portfolio"/);
  assert.match(source, /Record transaction/);
  assert.match(source, /Price refresh interval/i);
  assert.match(source, /role="region"/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(
    source,
    /<TransactionWorkspace\s+quotes=\{q\}\s+positions=\{positions\}/,
  );
  assert.match(source, /model\.allocations\.slice\(0, 3\)\.map/);
  assert.doesNotMatch(source, /142,680|18,420|17,120/);
});

test("performance panel fails closed without corporate-action and transaction evidence", () => {
  assert.match(source, /<AccountHistory/);
  const history = readFileSync(
    new URL("../components/AccountHistory.tsx", import.meta.url),
    "utf8",
  );
  assert.match(history, /No current-holdings backcast/);
  assert.match(history, /disabled=\{!confirmed \|\| !reviewed \|\| busy\}/);
  assert.match(source, /<ApprovedPortfolioChart/);
  assert.match(history, /Not actual account performance/);
});
