import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => fs.readFileSync("components/" + f, "utf8");
test("comparison financial rows lead while dated accounting basis remains accessible per company", () => {
  const s = read("SupportingViews.tsx");
  assert.match(s, /<summary>Accounting basis<\/summary>/);
  assert.match(s, /className=\{decisionStyles.basisDate\}/);
  assert.match(s, /Reporting currency/);
  const body = s.slice(s.indexOf('<table className="compare-table">'));
  assert.match(body, /<tbody>\s*\{\[\s*"Revenue"/);
  assert.doesNotMatch(body, /"Company",\s*"Reporting period",/);
});
test("watchlist labels its actual selected order without claiming confirmed readings or change-ranked history", () => {
  const s = read("WatchlistPage.tsx");
  assert.match(s, /Latest quoted change · dates shown/);
  assert.match(s, /Alphabetical order/);
  assert.doesNotMatch(s, /Prices and confirmed accumulation readings/);
});
