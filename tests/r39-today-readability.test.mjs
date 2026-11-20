import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const view = readFileSync("components/HomeWorkspace.tsx", "utf8");
const css = readFileSync("components/HomeWorkspace.module.css", "utf8");

test("Today trims repeated intro copy and preserves exact event availability and refresh states", () => {
  assert.doesNotMatch(
    view,
    /Research priorities, upcoming events and what changed|Recent company updates, with the source attached/,
  );
  assert.match(
    view,
    /title="Earnings & events"\s+subtitle=\{\s*eventGroups\.length/,
  );
  assert.match(view, /Missing coverage does not mean no events/);
  assert.match(view, /aria-label="Refresh company events"/);
  assert.match(
    css,
    /\.dailyBrief :global\(\.home-events-panel\) \{[^}]*grid-template-columns: minmax\(0, 1fr\)/,
  );
});

test("headline logo anchors a compact row while ticker and source remain separate links", () => {
  assert.match(
    view,
    /className=\{homeStyles\.headlineRow\}[\s\S]*?<SecurityLogo symbol=\{news\.symbol\}/,
  );
  assert.match(
    view,
    /<Link href=\{researchLink\(news\.symbol, prefix\)\}>\{news\.symbol\}<\/Link>/,
  );
  assert.match(view, /href=\{news\.url\}[\s\S]*?\{news\.title\}/);
  assert.match(
    css,
    /\.headlineRow\s*\{[^}]*grid-template-columns: 32px minmax\(0, 1fr\)/,
  );
});

test("contribution planning has no repeated instructions and retains both research actions and Radar", () => {
  assert.doesNotMatch(
    view,
    /Review the evidence and position limits before adding/,
  );
  assert.match(view, /href=\{\x60\$\{prefix\}\/monthly-plan\x60\}/);
  assert.match(view, /<ContributionCompare/);
  assert.match(view, /<HomeRadar/);
  assert.match(css, /\.workspaceLink\s*\{[^}]*justify-self: start/);
});

test("earnings refresh has a local 44px target and visible keyboard focus", () => {
  const refresh = view.match(
    /<button\b[^>]*aria-label="Refresh company events"/,
  );
  assert.ok(refresh);
  assert.match(refresh[0], /className=\{homeStyles\.calendarRefresh\}/);
  assert.match(
    css,
    /\.calendarRefresh\s*\{[^}]*min-inline-size: 44px;[^}]*min-block-size: 44px/,
  );
  assert.match(
    css,
    /\.calendarRefresh:focus-visible\s*\{[^}]*outline: 2px solid/,
  );
});

test("Today presents one narrative before benchmarks and the full company evidence", () => {
  const story = view.indexOf('aria-label="Today’s story"');
  const market = view.indexOf('aria-label="Daily market briefing"');
  assert.ok(
    story > 0 && story < market && market < view.indexOf('id="home-earnings"'),
  );
  assert.match(view, /\["SPY", "QQQ"\] as const/);
  assert.match(view, /useResource<QuoteRows>/);
  assert.match(view, /aria-label="ETF market proxies"/);
  for (const label of ["Why it matters", "Auryn thought"])
    assert.ok(view.includes(label));
  assert.match(view, /secondaryHeadlines = spotlight\s*\? headlines\.filter/);
  assert.doesNotMatch(view, /aria-label="Daily priorities"/);
  assert.match(view, /dailyPerspective\(day\)/);
  assert.doesNotMatch(view, /Research question/);
});
