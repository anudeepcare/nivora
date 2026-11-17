import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
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
test("decision queue uses accessible bounded mobile lists without locking the document", () => {
  const css = read("components/DecisionLists.module.css");
  const rules = [];
  postcss.parse(css).walkRules(rule => rules.push(rule));
  const declaration = (rule, prop) => rule.nodes.find(node => node.type === "decl" && node.prop === prop)?.value;
  const mobileList = rules.find(rule => rule.selector === ".queue ul" && rule.parent.type === "atrule" && /max-width:\s*650px/.test(rule.parent.params));
  assert.ok(mobileList, "mobile list keeps a dedicated responsive rule");
  assert.equal(declaration(mobileList, "display"), "grid");
  assert.equal(declaration(mobileList, "overflow"), "auto");
  assert.equal(declaration(mobileList, "max-height"), "min(75svh, 840px)");
  const roots = rules.filter(rule => rule.selector.split(",").map(x => x.trim()).some(x => [".compare", ".watchlist", ".queue"].includes(x)));
  assert.ok(roots.length > 0);
  for (const rule of roots) {
    assert.notEqual(declaration(rule, "position"), "fixed", rule.selector);
    assert.ok(!declaration(rule, "height"), "page roots must not have a fixed height");
    assert.ok(!declaration(rule, "max-height"), "only long lists are height-bounded");
    assert.notEqual(declaration(rule, "overflow"), "hidden", rule.selector);
  }
  assert.ok(rules.some(rule => rule.selector === ".queue ul:focus-visible"));
  const watchlist = read("components/WatchlistPage.tsx");
  assert.match(watchlist, /<ul\s+tabIndex=\{0\}/);
  assert.match(watchlist, /aria-label="Followed companies, scroll for more rows"/);
  assert.match(css, /\.compare :global\(\.table-scroll\)/);
});
