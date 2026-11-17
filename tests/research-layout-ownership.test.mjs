import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/Research.tsx", "utf8");
const css = fs.readFileSync("components/ResearchDeskLayout.module.css", "utf8");
test("research disclosures retain facts without a repeated top-level metric strip", () => {
  assert.match(
    source,
    /<details className=\{cockpit.facts\}>[\s\S]*?<StockFacts research=\{r\} \/>[\s\S]*?<\/details>/,
  );
  assert.equal((source.match(/<StockFacts/g) || []).length, 1);
});
test("Events uses the same direct child grid owner as its source and earnings layout", () => {
  const news = source.slice(
    source.indexOf('{tab === "News"'),
    source.indexOf('{tab === "Advanced"'),
  );
  assert.match(news, /<CompanyUpdates/);
  assert.doesNotMatch(news, /cockpit.eventsGrid/);
  assert.match(css, /\[data-desk="News"\] > :global\(\.depth-news\)/);
});
test("ownership evidence cannot be pinned over earlier content in row one", () => {
  assert.doesNotMatch(css, /grid-row:\s*[12];/);
});
test("Pace has one reading owner, not a duplicated leading reading", () => {
  const pace = source.slice(
    source.indexOf('{tab === "Pace"'),
    source.indexOf('{tab === "Thesis"'),
  );
  assert.match(pace, /<DcaResearch/);
  assert.doesNotMatch(pace, /<PaceReadings|<header/);
});
