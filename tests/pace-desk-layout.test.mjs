import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("Pace desk uses compact observation strip and visible conditional prices", () => {
  const s = read("components/AccumulationDesk.tsx");
  assert.match(s, /detail\.desk/);
  assert.match(s, /detail\.observations/);
  assert.match(s, /detail\.chartHeading/);
  assert.match(s, /<details open className=\{detail.levels\}>/);
  assert.match(s, /Price observation basis/);
  assert.match(s, /PaceEvidenceJourney research=\{r\}/);
  assert.match(s, /PaceHistoryInsights research=\{r\}/);
});
test("Pace desk supports narrow screens and borderless comparison hierarchy", () => {
  const s = read("components/PaceDeskDetails.module.css");
  assert.match(s, /\.observations/);
  assert.match(s, /@media \(max-width: 700px\)/);
  assert.match(s, /\.pace-period/);
  assert.match(s, /font-variant-numeric: tabular-nums/);
});
test("Pace interprets chart colours before history and separates forming from confirmed rationale", () => {
  const s = read("components/AccumulationDesk.tsx");
  assert.ok(
    s.indexOf('aria-label="Chart zone legend"') <
      s.indexOf("<PaceMonthHistory"),
  );
  assert.ok(
    s.indexOf("Conditional zone prices") < s.indexOf("<PaceEvidenceJourney"),
  );
  assert.match(s, /Current forming context/);
  assert.match(s, /chosen\.forming\.reason/);
  assert.match(s, /Not a buy or sell\s+instruction/);
  assert.match(s, /!\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\//);
});
