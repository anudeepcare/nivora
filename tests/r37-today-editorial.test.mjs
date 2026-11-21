import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const jsx = readFileSync("components/HomeWorkspace.tsx", "utf8");
const css = readFileSync("components/HomeWorkspace.module.css", "utf8");

test("Today uses an inline calendar state and a genuine research link beside source updates", () => {
  assert.match(jsx, /className=\{homeStyles\.calendarState\}/);
  assert.match(jsx, /Calendar coverage is incomplete/);
  assert.match(
    jsx,
    /className=\{homeStyles\.updateAction\}[\s\S]+href=\{\`\$\{prefix\}\/research\`\}/,
  );
  assert.match(
    css,
    /\.updateFeed > :global\(\.home-news-panel\)[^{]*\{[^}]*background: transparent/s,
  );
});

test("the research tools share a width as either expands so neither leaves an empty neighbor", () => {
  assert.match(jsx, /className=\{homeStyles\.researchTools\}/);
  assert.match(
    css,
    /\.actionGrid\s*\{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\)/,
  );
  assert.match(
    jsx,
    /onToggle=\{\(event\) => setRadarOpen\(event.currentTarget.open\)\}/,
  );
});

test("cached empty earnings cannot be reported as current after a failed refresh", () => {
  assert.match(
    jsx,
    /const calendarReady = readiness\.eventsReady && !feed\.error;/,
  );
  assert.match(jsx, /: !calendarReady\s*\? "Calendar coverage is incomplete/);
  assert.match(
    jsx,
    /onClick=\{feed\.refresh\}\s+disabled=\{feed.loading\}\s+aria-label="Refresh company events"/,
  );
});
