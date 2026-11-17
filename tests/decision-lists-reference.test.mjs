import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) =>
  fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("compare uses sourced decision cards and existing real portfolio capacity calculator", () => {
  const s = read("components/SupportingViews.tsx");
  assert.ok(s.includes("CONTRIBUTION COMPARISON"));
  assert.ok(s.includes('aria-label="Decision comparison"'));
  assert.ok(s.includes("edge.pacePresentation.code"));
  assert.ok(s.replace(/\s+/g, " ").includes("No automatic winner or allocation is inferred."));
  assert.ok(s.includes("<ContributionCompare"));
  assert.ok(s.includes("comparisonCompatibility("));
});
test("watchlist queue preserves dates, missing evidence and mutations instead of mock scores", () => {
  const s = read("components/WatchlistPage.tsx");
  for (const v of [
    "DECISION QUEUE",
    "EVIDENCE / NEXT CONDITION",
    "signal?.changeCondition",
    "quoteTime(row.quote.asOf",
    "Undo removal",
    'op: "unwatch"',
    "Next earnings unconfirmed",
  ])
    assert.ok(s.includes(v), v);
  assert.ok(!s.includes("ranked by what changed"));
});
test("decision queue uses mobile cards without locking the document", () => {
  const css = read("components/DecisionLists.module.css");
  assert.match(css, /@media\s*\(max-width:\s*650px\)/);
  assert.match(css, /overflow:\s*visible/);
  assert.ok(!css.includes("height: 100vh"));
  assert.match(css, /\.compare :global\(\.table-scroll\)/);
});
