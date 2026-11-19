import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/Research.tsx", "utf8");
const css = fs.readFileSync("components/ResearchDeskLayout.module.css", "utf8");
test("research disclosures retain facts without a repeated top-level metric strip", () => {
  assert.match(
    source,
    /<Help label="Company facts and source dates">\s*<StockFacts research=\{r\} \/>[\s\S]*?<\/Help>/,
  );
  assert.equal((source.match(/<StockFacts/g) || []).length, 1);
});
test("Events uses the same direct child grid owner as its source and earnings layout", () => {
  const news = source.slice(
    source.indexOf('{tab === "News"'),
    source.indexOf('{tab === "Advanced"'),
  );
  assert.match(news, /<EventsLens/);
  const direct = fs.readFileSync("components/DirectResearchLenses.tsx", "utf8");
  assert.match(direct, /<CompanyUpdates/);
  assert.match(direct, /<CompanyEventCalendar/);
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
test("Atlas keeps its observed price chart outside collapsed secondary evidence", () => {
  const atlas = source.slice(
    source.indexOf('<div id="research-overview"'),
    source.indexOf("className={`signal-research-panel"),
  );
  assert.match(
    atlas,
    /<div className=\{cockpit.primaryChart\}>\{chart\}<\/div>/,
  );
  const detail = atlas.slice(atlas.indexOf("<details"));
  assert.doesNotMatch(detail, /chart=\{chart\}/);
});
test("Technicals leads with price studies rather than repeating the Pace desk", () => {
  const technical = source.slice(
    source.indexOf('data-retained-panel="Technicals"'),
    source.indexOf('{tab === "Pace"'),
  );
  assert.match(technical, /<TechnicalPicture/);
  assert.doesNotMatch(technical, /<PaceReadings|<DcaResearch/);
});
test("active Technicals does not depend on retained mount state", () => {
  assert.match(
    source,
    /\(tab === "Technicals" \|\|\s*retainedCharts\.includes\("Technicals"\)\)/,
  );
  assert.match(source, /Show technical indicators/);
  assert.match(source, /signal !== "technicals"/);
  assert.match(source, /workspacePreferences.error &&/);
});
test("Technical chart precedes interpretation and supplementary facts", () => {
  const dashboard = fs.readFileSync(
    "components/TechnicalDashboard.tsx",
    "utf8",
  );
  assert.ok(
    dashboard.indexOf("{chart &&") <
      dashboard.indexOf('<header className="technical-desk-heading">'),
  );
  const technical = source.slice(
    source.indexOf('data-retained-panel="Technicals"'),
    source.indexOf('{tab === "Pace"'),
  );
  assert.doesNotMatch(technical, /<h2>Technicals<\/h2>|Chart interval/);
  assert.equal((source.match(/\{evidenceToolbar\}/g) || []).length, 1);
  assert.doesNotMatch(source, /<details className=\{cockpit.facts\}>/);
  assert.match(
    source,
    /const evidenceToolbar =\s*supportingSections.length > 1/,
  );
});
