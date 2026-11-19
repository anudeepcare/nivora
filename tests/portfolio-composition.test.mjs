import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
test("allocation shows scoped concentration and visible sector context", () => {
  assert.match(source, /Largest three holdings/);
  assert.match(source, /Share of priced investments/);
  assert.match(source, /model\.allocations\s*\.slice\(0, 3\)/);
  assert.doesNotMatch(source, /<details className={reference.exposure}>/);
  assert.match(source, /aria-label="Sector and crypto exposure groups"/);
});
test("purchase and dated transaction workflows remain distinct", () => {
  assert.match(source, /Add purchase/);
  assert.match(source, /directRecord/);
  assert.match(source, /onAddPurchase=/);
  assert.match(source, /Cash &amp; balances/);
});
