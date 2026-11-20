import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("empty calendar uses compact content-height status while keeping real news and coverage states", () => {
  const src = fs.readFileSync("components/HomeWorkspace.tsx", "utf8");
  const css = fs.readFileSync("components/HomeWorkspace.module.css", "utf8");
  assert.match(
    src,
    /data-calendar-empty=\{\s*!eventGroups.length && !brief.reported.length\s*\}/,
  );
  assert.match(
    css,
    /\[data-calendar-empty="true"\][^{]*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s,
  );
  assert.match(css, /\.home-events-panel[\s\S]*align-self: start/);
  assert.match(
    css,
    /\.dailyBrief\s*\{[^}]*grid-template-columns: repeat\(auto-fit,/,
  );
  assert.match(src, /Calendar coverage is incomplete/);
  assert.match(src, /Missing coverage does not mean no events/);
  assert.match(src, /secondaryHeadlines.slice\(0, 6\).map\(renderHeadline\)/);
  assert.ok(
    src.indexOf('title="What changed"') <
      src.indexOf('aria-label="Workspace shortcuts"'),
  );
  assert.ok(
    src.indexOf('title="What changed"') < src.indexOf("<HomeMarketCards"),
  );
  assert.equal(
    (src.match(/aria-label="Workspace shortcuts"/g) || []).length,
    1,
  );
});
test("secondary holdings comparison keeps totals beside bounded contribution rows on desktop", () => {
  const css = fs.readFileSync("components/PortfolioDay.module.css", "utf8");
  assert.match(
    css,
    /grid-template-columns: minmax\(240px, 0.65fr\) minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /grid-template-columns: 72px minmax\(70px, 1fr\) max-content/,
  );
  assert.match(css, /@container holdings-snapshot \(max-width:360px\)/);
});
