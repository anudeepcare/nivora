import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(path, "utf8");
const home = source("components/HomeWorkspace.tsx");
const css = source("components/HomeWorkspace.module.css");

test("daily thought uses the New York day, catches suspended timers and cleans up", async () => {
  const { watchMarketDay } = await import("../lib/today-market-clock.ts");
  let now = Date.parse("2026-11-20T04:59:59Z");
  const target = new EventTarget();
  const updates = [];
  let tick;
  const timer = {
    setInterval(fn, interval) {
      assert.equal(interval, 60_000);
      tick = fn;
      return 9;
    },
    clearInterval(id) {
      assert.equal(id, 9);
      tick = undefined;
    },
  };
  const stop = watchMarketDay((day) => updates.push(day), {
    now: () => now,
    timer,
    resume: target,
  });
  assert.deepEqual(updates, ["2026-11-19"]);
  tick();
  assert.deepEqual(updates, ["2026-11-19"]);
  now = Date.parse("2026-11-20T05:00:30Z");
  tick();
  assert.deepEqual(updates, ["2026-11-19", "2026-11-20"]);
  now = Date.parse("2026-11-22T19:00:00Z");
  target.dispatchEvent(new Event("visibilitychange"));
  assert.deepEqual(updates, ["2026-11-19", "2026-11-20", "2026-11-22"]);
  stop();
  assert.equal(tick, undefined);
  now = Date.parse("2026-11-23T19:00:00Z");
  target.dispatchEvent(new Event("visibilitychange"));
  assert.equal(updates.length, 3);
});

test("Today removes hollow secondary UI while retaining quotes and access to workspace tools", () => {
  assert.doesNotMatch(
    home,
    /<PaceBoard|className=\{homeStyles.quoteStatus\}|Research question/,
  );
  assert.match(home, /useWorkspaceData\("all", \{ scanPace: false \}\)/);
  assert.match(
    home,
    /<HomeMarketCards[\s\S]+quoteContext=\{symbols.length \? <Coverage state=\{state\} \/> : null\}/,
  );
  assert.match(
    home,
    /<aside\b[^>]*aria-label="Auryn thought"[\s\S]*?dailyPerspective\(day\)/,
  );
  assert.match(home, /preview \? undefined : watchMarketDay/);
  assert.match(home, /setRadarOpen\] = useState\(false\)/);
  assert.match(home, /radarOpen && \([\s\S]*?<HomeRadar/);
  assert.match(home, /href=\{[^\n]+\/monthly-plan/);
});

test("market quotes and calendars share a responsive primary briefing grid", () => {
  const briefing = home.indexOf('aria-label="Daily market briefing"');
  const market = home.indexOf(">Market snapshot</h2>");
  const watch = home.indexOf("<TodayMacroWatch");
  const earnings = home.indexOf('id="home-earnings"');
  assert.ok(briefing < market && market < watch && watch < earnings);
  assert.match(
    home.slice(earnings),
    /<\/section>\s*<\/div>\s*\)\}\s*<\/section>/,
  );
  assert.match(css, /\.dailyBrief\s*\{[^}]*align-items:\s*start/);
  assert.match(
    css,
    /@container daily-brief \(624px <= width < 948px\)[\s\S]*?\.dailyBrief:has\(> :nth-child\(3\)\)[^{}]*\{[^}]*grid-column:\s*1 \/ -1/,
  );
  assert.match(
    home,
    /<SectionHead\s+title="Earnings & events"[\s\S]*?className=\{homeStyles.calendarHeader\}/,
  );
  assert.match(css, /\.calendarHeader\s*\{[^}]*align-items:\s*start/);
  assert.match(
    source("components/WorkspaceShared.tsx"),
    /className=\{\s*className \? .*visual\.sectionHead.* : visual\.sectionHead\s*\}/s,
  );

  assert.match(
    css,
    /\.dailyBrief\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 300px\), 1fr\)\)/,
  );
});

test("the curated Auryn thought does not repeat every week", async () => {
  const { dailyPerspective } = await import("../lib/home-brief.ts");
  const start = Date.parse("2026-11-20");
  const thoughts = Array.from({ length: 14 }, (_, i) =>
    dailyPerspective(new Date(start + i * 86400000).toISOString().slice(0, 10)),
  );
  assert.equal(new Set(thoughts).size, 14);
});

test("Today has a compact evidence lead and routes to Portfolio instead of repeating the holdings total", () => {
  assert.match(
    home,
    /<nav\s+className=\{homeStyles.workspaceShortcuts\}[\s\S]*?href=\{[^\n]+\/portfolio/,
  );
  assert.doesNotMatch(home, /<PortfolioDay|Your workspace/);
  assert.match(
    css,
    /\.narrative\[data-story="empty"\]\s*\{[^}]*background: transparent/,
  );
  assert.match(
    css,
    /\.quoteMeta \[data-freshness="older"\][^{}]*\{[^}]*var\(--amber\)/,
  );
});
