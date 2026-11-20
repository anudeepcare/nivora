import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (f) => readFileSync(`components/${f}`, "utf8");
test("Pace method strip reuses the chart's only zone key and the workspace category palette", () => {
  const source = read("AccumulationDesk.tsx");
  const key = source.slice(
    source.indexOf('aria-label="Chart zone legend"'),
    source.indexOf("</figure>"),
  );
  assert.equal(
    (source.match(/aria-label="Chart zone legend"/g) ?? []).length,
    1,
  );
  assert.match(key, /Pace zones · Price conditions, not recommendations/);
  assert.match(key, /paceStyles\.palette/);
  assert.match(key, /data-pace-level=\{n\}/);
  assert.match(key, /background: colours\[n\]/);
  assert.match(key, /No eligible signal/);
  assert.match(key, /background: paceUnavailableColour/);
  assert.doesNotMatch(key, /aria-current|aria-selected/);
});
test("Pace key is one quiet responsive strip and keeps non-zone meanings separate", () => {
  const css = read("PaceDeskDetails.module.css");
  assert.match(css, /\.stageScale\s*\{[^}]+grid-template-columns: repeat\(5,/s);
  assert.match(
    css,
    /\.stageScale > span\s*\{[^}]+background: var\(--workspace-pace-fill\)[^}]+color: var\(--workspace-pace-ink\)/s,
  );
  assert.match(css, /max-width: 460px[\s\S]+repeat\(3,/);
});
