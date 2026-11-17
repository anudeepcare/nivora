import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (f) => fs.readFileSync(f, "utf8");
const props = (file, selector) => {
  const p = {};
  postcss.parse(read(file)).walkRules((r) => {
    if (r.selector === selector) r.walkDecls((d) => (p[d.prop] = d.value));
  });
  return p;
};
test("Today priorities share a single desktop row and retain natural height and mobile stacking", () => {
  const css = read("components/TodaySequence.module.css");
  assert.match(css, /grid-template-columns: 1\.2fr 1fr 1fr/);
  assert.doesNotMatch(css, /grid-row: 1\/3/);
  assert.match(css, /flex-direction: column/);
  assert.equal(
    props("components/TodaySequence.module.css", ".sequence a")["min-height"],
    "44px",
  );
  assert.doesNotMatch(css, /line-clamp|max-height:/);
});
test("Discover secondary filters use a reversible disclosure before results, without hiding the scan action", () => {
  const s = read("components/Discover.tsx");
  assert.match(s, /<details className=\{discoverStyles.filterPanel\}>/);
  assert.match(s, /<summary>Filters &amp; saved screen<\/summary>/);
  assert.ok(
    s.indexOf("onSubmit={scan}") < s.indexOf("discoverStyles.filterPanel"),
  );
  assert.ok(
    s.indexOf("discoverStyles.filterPanel") < s.indexOf("<DiscoveryPlot"),
  );
  assert.match(s, /Reset filters/);
  assert.match(s, /Save screen/);
});

test("Compare keeps the ticker form visible and secondary company lookup collapsible", () => {
  const s = read("components/SupportingViews.tsx");
  assert.match(s, /<details className=\{decisionStyles.lookup\}>/);
  assert.match(s, /<summary>Find companies by name<\/summary>/);
  assert.match(s, /aria-label="Companies to compare"/);
});
test("Portfolio starts with compact metrics and keeps explanations behind disclosure", () => {
  const s = read("components/PortfolioPage.tsx");
  assert.match(s, /<details className=\{reference.summaryDetails\}>/);
  assert.doesNotMatch(
    s,
    /<details className=\{reference.summaryDetails\} open/,
  );
  assert.match(
    read("components/PortfolioReference.module.css"),
    /clamp\(28px, 2\.4vw, 34px\)/,
  );
});
