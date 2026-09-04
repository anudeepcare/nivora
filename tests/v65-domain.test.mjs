import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("V65 domain separates asset types and decision horizons", () => {
  const p="lib/v65/domain.ts";
  assert.equal(fs.existsSync(p), true, "V65 domain contract must exist");
  const s=fs.readFileSync(p,"utf8");
  for (const token of ["EQUITY","CRYPTO","CASH","longTerm","newMoney","owner","evidenceAsOf","lastMeaningfulChangeAt","changedBecause","previousValue"]) {
    assert.ok(s.includes(token), `missing ${token}`);
  }
});
