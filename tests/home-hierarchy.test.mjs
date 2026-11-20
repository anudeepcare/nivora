import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const home = readFileSync("components/HomeWorkspace.tsx", "utf8");
test("Today leads with attention and dated events before stock and portfolio context", () => {
  assert.ok(home.indexOf("<PortfolioDay") > home.indexOf("<HomeMarketCards"));
  assert.ok(
    home.indexOf('id="home-earnings"') < home.indexOf("<HomeMarketCards"),
  );
  assert.match(home, /<PortfolioDay\s+compact/);
  assert.ok(
    home.indexOf('aria-label="Today’s story"') <
      home.indexOf("<HomeMarketCards"),
  );
  assert.ok(home.indexOf("<ResearchInbox") < home.indexOf("<HomeMarketCards"));
  assert.doesNotMatch(home, /<summary>Followed company prices<\/summary>/);
  assert.match(home, /secondaryHeadlines = spotlight\s*\? headlines\.filter/);
  assert.equal((home.match(/<Coverage state=/g) || []).length, 1);
  assert.match(
    home,
    /<HomeMarketCards[\s\S]*?quoteContext=\{symbols.length \? <Coverage state=/,
  );
});
test("radar diagnostics remain reachable on demand without eager loading", () => {
  assert.match(home, /\[radarOpen, setRadarOpen\] = useState\(false\)/);
  assert.match(
    home,
    /onToggle=\{\(event\) => setRadarOpen\(event.currentTarget.open\)\}/,
  );
  assert.match(home, /<HomeRadar/);
  const radar = readFileSync("components/HomeRadar.tsx", "utf8");
  assert.match(radar, /<OpportunityMap/);
  assert.match(radar, /<MarketRadar/);
});
test("public Product navigation targets the actual connected tour, without repeating the same three questions", () => {
  const source = readFileSync("components/PublicLanding.tsx", "utf8");
  assert.equal((source.match(/id="how-it-works"/g) || []).length, 1);
  const story = source.match(
    /<section\b(?=[^>]*\bid="how-it-works")[^>]*>([\s\S]*?)<\/section>/,
  );
  assert.ok(story, "the Product anchor identifies a public section");
  assert.match(story[0], /\blanding\.referenceStory\b/);
  assert.match(story[0], /aria-labelledby="reference-story-title"/);
  assert.match(story[1], /<h2 id="reference-story-title">/);
  assert.match(
    story[1],
    /sampleOnly\s*\?\s*<InvestmentDemo \/>\s*:\s*<ReferenceProductTour \/>/,
  );
  assert.doesNotMatch(
    source,
    /ap-workflow-heading|Three questions before every contribution/,
  );
  for (const section of [
    "ReferenceProductTour",
    "pace-public",
    "use-cases",
    'id="pricing"',
  ])
    assert.ok(source.includes(section));
});
test("exposure highlights the existing actual portfolio weight, never a synthetic score", () => {
  const source = readFileSync("components/TodaySequence.tsx", "utf8");
  assert.match(
    source,
    /className=\{styles.exposureMetric\}[\s\S]*?concentration.weight.toFixed\(1\)/,
  );
  assert.match(source, /Of the priced portfolio/);
});

test("contribution planning and market radar follow all primary Today evidence", () => {
  const body = home.slice(home.indexOf("function HomeOverview()"));
  assert.ok(
    body.indexOf("Your workspace") > body.indexOf("<HomeQuarterHighlights"),
  );
  assert.ok(
    body.indexOf("<ContributionCompare") > body.indexOf("<PortfolioDay"),
  );
  assert.ok(
    body.indexOf("Market radar") > body.indexOf("<ContributionCompare"),
  );
  assert.match(
    body,
    /onToggle=\{\(event\) => setRadarOpen\(event.currentTarget.open\)\}/,
  );
});
