import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(`components/${file}`, "utf8");
test("watchlist puts actual companies before supporting review and keeps compact evidence", () => {
  const source = read("WatchlistPage.tsx");
  assert.ok(
    source.indexOf('title="Your watchlist"') <
      source.indexOf("<DecisionAttention"),
  );
  assert.match(source, /<DecisionAttention\s+compact/);
  assert.doesNotMatch(source, /Companies in your watchlist<\/p>/);
});
test("workspace surfaces do not restore the rejected dark watchlist billboard", () => {
  const css = read("WorkspaceVisuals.module.css");
  assert.doesNotMatch(css, /background: var\(--ink\)/);
  assert.match(css, /background: var\(--card\)/);
  assert.doesNotMatch(css, /backdrop-filter/);
});
test("public hero pairs its intro with a lightweight illustrative product guide", () => {
  assert.match(
    read("PublicLanding.module.css"),
    /grid-template-columns: 1\.05fr 1fr/,
  );
  assert.doesNotMatch(
    read("PublicLanding.tsx"),
    /Research\.\s*<br \/>\s*<span>Decide\.<\/span>/,
  );
});

test("support priority and status labels have independent width rather than shrinking beside full-width selects", () => {
  const source = read("SupportInbox.tsx");
  assert.match(source, /<span>Priority<\/span>/);
  assert.match(source, /<span>Status<\/span>/);
  assert.match(
    read("SupportInbox.module.css"),
    /grid-template-columns: 80px minmax\(0, 1fr\)/,
  );
});

test("settings uses open category surfaces and intentional touch-sized controls", () => {
  const css = read("SettingsPage.module.css");
  assert.match(css, /workspace-setting-group/);
  assert.match(css, /\[hidden\]\s*\{\s*display: none/);
  assert.match(css, /min-height: 64px/);
  assert.match(css, /background: var\(--workspace-panel\)/);
  assert.match(css, /background: var\(--surface\)/);
  assert.match(css, /min-height: 44px/);
});

test("password recovery shares login composition instead of legacy-only classes", () => {
  const source = read("PasswordRecovery.tsx");
  assert.match(source, /import experience from "\.\/Session.module.css"/);
  for (const name of ["auth", "main", "story", "storyContent"])
    assert.ok(source.includes(`experience.${name}`));
});
test("support and release decoration no longer uses the retired green interaction palette", () => {
  assert.doesNotMatch(
    read("Contact.module.css"),
    /#319688|accent-color: var\(--green\)/,
  );
  assert.doesNotMatch(
    read("ReleaseNotes.module.css"),
    /var\(--green\)|#294d38/,
  );
});
test("discovery results can be scrolled with a keyboard", () => {
  assert.match(
    read("Discover.tsx"),
    /className="table-scroll"\s+role="region"\s+aria-label="Discovered companies"\s+tabIndex=\{0\}/,
  );
});

test("primary workspace cards stretch within their row without equalizing unrelated rows", () => {
  const portfolio = read("PortfolioWorkspace.module.css");
  assert.match(portfolio, /:global\(\.portfolio-grid\) \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(portfolio, /\.portfolioRead \{[^}]*grid-template-columns: minmax\(0, 1.1fr\) minmax\(0, 1fr\)/);
  assert.match(portfolio, /:global\(\.portfolio-holdings-panel\)[^{]*[\s\S]*grid-column: 1\/-1/);
  assert.match(read("HomeDailyBriefing.module.css"), /align-items: stretch/);
  assert.match(
    read("SettingsPage.module.css"),
    /grid-template-rows: auto auto auto auto min-content 1fr/,
  );
});

test("ticket controls form a bounded responsive row and delivery status remains data driven", () => {
  const source = read("SupportInbox.tsx"),
    css = read("SupportInbox.module.css");
  assert.match(source, /className=\{s.ticketControls\}/);
  assert.match(css, /max-width: 1000px/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(
    source,
    /r.owner_notified_at \? "Owner notified" : "Owner email pending"/,
  );
  assert.match(source, /r.receipt_sent_at/);
  assert.match(source, /r.attempts >= 5/);
});
