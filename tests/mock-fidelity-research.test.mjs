import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("overview avoids duplicating evidence and tall summary cards", () => {
  const source = read("components/IntegratedResearch.tsx");
  assert.doesNotMatch(source, /<CompanyMetrics/);
  assert.match(source, /summaryView/);
  assert.match(source, /className=\{s\.decisionExplanation\}/);
});
test("bounded evidence cards align rows and all data remains mapped", () => {
  const css = read("components/ResearchEvidenceGrid.module.css");
  assert.match(css, /align-items: stretch/);
  assert.match(
    read("components/ResearchEvidenceGrid.tsx"),
    /renderRows\(ordered, key, true\)/,
  );
  assert.match(read("components/ResearchEvidenceGrid.tsx"), /rows\.map/);
});
test("chart tools follow chart rather than push it below fold", () => {
  const s = read("components/PriceStudyChart.tsx");
  assert.ok(
    s.indexOf("<PriceChart") < s.indexOf('className={s.tools}'),
  );
  assert.doesNotMatch(s, /className="chart-context" open/);
});

test("mobile reorganizes financial snapshot and business core without losing rows", () => {
  const source = read("components/ResearchEvidenceGrid.tsx");
  assert.match(source, /aria-label="Financial snapshot"/);
  for (const key of [
    "marketCap",
    "revenueGrowth",
    "fcfMargin",
    "operatingMargin",
    "netMargin",
    "TrailingPE",
  ])
    assert.ok(source.includes(`"${key}"`));
  assert.match(source, /renderRows\(rows, key, true\)/);
  const css = read("components/ResearchEvidenceGrid.module.css");
  assert.match(css, /\.desktopEvidence\s*\{\s*display: none/);
  assert.match(
    css,
    /\.businessStrip dl\s*\{\s*grid-template-columns: repeat\(3/,
  );
});
test("Pace labels honor dark theme and contrast", () => {
  const source = read("components/Charts.tsx");
  assert.match(source, /theme === "dark"\s*\? "#edf3ff"/);
  assert.match(source, /contrast\s*\? "#000000"/);
});

test("complex pace bands stay inline instead of creating nested rows", () => {
  const source = read("components/PacePriceZones.tsx");
  assert.match(source, /<span[\s\S]*?className=\{styles.bandCount\}/);
  assert.doesNotMatch(source, /<small className=\{styles.bandCount\}/);
});

test("date footer does not reserve empty desktop evidence tracks", () => {
  const source = read("components/ResearchEvidenceGrid.tsx");
  assert.match(source, /<\/section>\s*<footer className=\{s.snapshot\}/);
  assert.match(read("components/ResearchEvidenceGrid.module.css"), /repeat\(auto-fit,/);
});

test("investment case uses full width when ownership evidence is unavailable", () => {
  assert.match(read("components/ResearchScreens.module.css"), /case-ownership-row\) > :only-child \{\s*grid-column: 1 \/ -1/);
});
