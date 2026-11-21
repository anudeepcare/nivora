import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
const home = read("components/HomeWorkspace.tsx");
const css = read("components/HomeWorkspace.module.css");
const macro = read("components/TodayMacroWatch.module.css");

test("benchmarks and calendars precede verified stories and the editorial note", () => {
  const glance = home.indexOf('aria-label="Daily market briefing"');
  const events = home.indexOf('id="home-earnings"');
  const story = home.indexOf('aria-label="Today’s story"');
  const thought = home.indexOf('aria-label="Auryn thought"');
  assert.ok(
    glance >= 0 && glance < events && events < story && story < thought,
  );
  assert.match(home, /\{story && \(\s*<section/);
  assert.doesNotMatch(
    home,
    /Start with what you can verify|No matching company report/,
  );
});

test("Today uses restrained separate surfaces in a real mobile grid, not a shared sheen", () => {
  assert.match(
    css,
    /\.dailyBrief\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /\.marketTape > div\s*\{[^}]*background:\s*var\(--plaid-card-blue/,
  );
  assert.match(
    css,
    /\.dailyBrief :global\(\.home-events-panel\)\s*\{[^}]*background:\s*var\(--plaid-card-purple/,
  );
  assert.match(macro, /\.watch\s*\{[^}]*background:\s*var\(--plaid-card-teal/);
  assert.match(
    css,
    /:global\(\.approved-product\[data-shell="mobile-first"\]\[data-page="overview"\]\):has\(\s*\.home\s*\)\s*\{\s*background:\s*var\(--plaid-canvas/,
  );
  assert.match(
    read("components/Shell.tsx"),
    /data-page=\{page\}\s+data-shell="mobile-first"/,
  );
  assert.match(
    read("app/core/mobile-glass.css"),
    /body \.product\.approved-product \{\s*background: transparent/,
  );
});

test("the visible catalyst is picked from upcoming held-first dates, not pending history", () => {
  assert.match(
    home,
    /const nextGroup = eventGroups\.find[\s\S]{0,140}group\.date >= day && marketDay\(group\.date\) === group\.date[\s\S]{0,70}const nextEvent = nextGroup\?\.events\[0\]/,
  );
  assert.match(home, /<time dateTime=\{nextEvent\.date\}/);
  assert.match(home, /<details className=\{homeStyles\.calendarDetails\}/);
  assert.match(home, /aria-label="Recently reported earnings"/);
});
