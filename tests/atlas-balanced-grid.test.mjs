import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Atlas uses balanced zero-minimum tracks and all six actual metric tiles stay in a phone grid", () => {
  const css = fs.readFileSync("components/ReferenceAtlas.module.css", "utf8");
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(
    css,
    /\.tape\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.doesNotMatch(css, /\.action button\s*\{/);
  const source = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(
    source,
    /className="auryn-inline-link"[\s\S]*?Open Pace evidence/,
  );
  assert.match(source, /value: percent\(b.businessNumbers.dilution\)/);
  assert.match(source, /Comparable reported periods; not a price return/);
});

test("Atlas price chart uses the same outer gutter rather than double horizontal padding", () => {
  const css = fs.readFileSync("components/ReferenceCockpit.module.css", "utf8");
  assert.match(css, /\.primaryChart\s*\{[\s\S]*?margin: 16px 0/);
  assert.match(css, /padding: 16px var\(--research-gutter\)/);
});

test("Outcome evidence keeps missing status visible and diagnostics accessible without tall prose rows", () => {
  const source = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  const css = fs.readFileSync("components/ReferenceAtlas.module.css", "utf8");
  assert.match(
    source,
    /<details className=\{s.evidenceCheck\} key=\{check.label\}>[\s\S]*?<summary>[\s\S]*?data-state=\{check.status\}>\{check.status\}<\/strong>[\s\S]*?<\/summary>\s*<p>\{check.detail\}<\/p>/,
  );
  assert.match(source, /Input availability · not confidence/);
  assert.match(
    css,
    /\.lower\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(css, /\.evidenceCheck summary[\s\S]*?min-height: 44px/);
  assert.match(source, /\{m.outcome.method\} · \{m.outcome.caveat\}/);
  const model = fs.readFileSync("lib/reference-atlas.ts", "utf8");
  assert.match(model, /Forecast-multiple sensitivity/);
  assert.match(
    model,
    /Conditional scenario prices, not independent fair value/,
  );
});
