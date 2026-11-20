import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("components/PaceHistoryInsights.tsx", "utf8");
const css = readFileSync("components/PaceHistoryInsights.module.css", "utf8");

test("monthly evidence aligns its heading and actual zone selector on the same rail", () => {
  const heading =
    component.match(
      /<header className=\{styles.heading\}>[\s\S]*?<\/header>/,
    )?.[0] ?? "";
  assert.match(heading, /How this zone behaved before/);
  assert.match(heading, /<label htmlFor="pace-history-zone">/);
  assert.match(heading, /value=\{selected\}/);
  assert.match(heading, /setSelected\(Number\(e.target.value\)\)/);
  assert.match(heading, /data.zones.map/);
  assert.match(css, /\.heading\s*\{[^}]*display: flex[^}]*flex-wrap: wrap/);
});

test("key historical metrics remain in a compact responsive strip and limitations stay available", () => {
  const stats =
    component.match(/<dl className=\{styles.stats\}>[\s\S]*?<\/dl>/)?.[0] ?? "";
  for (const metric of [
    "zone.visits",
    "zone.medianDuration",
    "zone.durationRange",
  ])
    assert.ok(stats.includes(metric));
  assert.match(css, /\.stats\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(
    css,
    /@media \(max-width: 520px\)[\s\S]*?\.stats\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(component, /Historical\s+observations,\s+not\s+a\s+forecast/);
  const methods =
    component.match(
      /<details[^>]*data-research-disclosure[^>]*>\s*<summary>Method and limitations<\/summary>[\s\S]*?<\/details>/,
    )?.[0] ?? "";
  for (const text of [
    "consecutive run",
    "fully elapsed windows",
    "Overlapping visits",
    "Dividends, fees",
  ])
    assert.ok(methods.includes(text), text);
  assert.match(component, /zone.outcomes.map/);
  assert.match(component, /Confirmed vs temporary readings/);
});
