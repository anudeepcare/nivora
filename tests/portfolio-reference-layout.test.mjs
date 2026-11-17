import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../components/PortfolioPage.tsx", import.meta.url),
  "utf8",
);
test("portfolio reference hierarchy preserves real positions and transaction controls", () => {
  assert.match(source, /Where conviction and exposure disagree/);
  assert.match(source, /Record transaction/);
  assert.match(source, /Columns & metrics/);
  assert.match(source, /role="region"/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(
    source,
    /<TransactionWorkspace quotes=\{q\} positions=\{positions\}/,
  );
  assert.match(source, /model\.allocations\.map/);
  assert.doesNotMatch(source, /142,680|18,420|17,120/);
});

test("performance panel fails closed without corporate-action and transaction evidence", () => {
  assert.match(source, /No\s+synthetic\s+performance is shown/);
  assert.doesNotMatch(source, /<ApprovedPortfolioChart/);
});
