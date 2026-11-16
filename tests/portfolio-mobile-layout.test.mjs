import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const workspace = fs.readFileSync("components/PortfolioWorkspace.module.css", "utf8");
const range = fs.readFileSync("components/PortfolioRange.module.css", "utf8");
test("holdings and watchlist tables contain intrinsic width without hiding columns", () => {
  assert.match(workspace, /\.ledger,\s*\.watchLedger\s*\{[^}]*position:\s*relative;[^}]*contain:\s*inline-size;[^}]*overflow:\s*auto;/s);
});
test("portfolio scenarios retain readable mobile amounts without legacy outlined tiles", () => {
  assert.match(range, /\.cases strong,\s*\.unavailableCases strong\s*\{[^}]*white-space:\s*nowrap;/s);
  assert.match(range, /@media \(max-width: 600px\)\s*\{\s*\.cases,\s*\.unavailableCases\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
  assert.doesNotMatch(range, /border-top:/);
});
