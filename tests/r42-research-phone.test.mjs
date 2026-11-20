import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(`components/${p}`, "utf8");

test("phone company name reads in full with normal wrapping and quieter quote/Pace", () => {
  const css = read("ResearchHeaderPace.module.css");
  const jsx = read("Research.tsx");
  assert.match(
    jsx,
    /className=\{headerPaceStyles.mobileName\}>\s*\{r.company.name\}/,
  );
  assert.match(
    css,
    /\.mobileName\s*\{[^}]*white-space: normal[^}]*overflow-wrap: anywhere/s,
  );
  assert.doesNotMatch(css, /text-overflow: ellipsis/);
  assert.match(
    css,
    /\.paceMobile \.mobileCode\s*\{[^}]*font-size: clamp\(18px/s,
  );
  assert.match(css, /grid-template-areas: "metrics pace" "stamp stamp"/);
});

test("the Atlas orbit caption sits outside its square plot with theme-aware labels", () => {
  const jsx = read("ReferenceAtlas.tsx"),
    css = read("ReferenceAtlas.module.css");
  assert.match(
    jsx,
    /className=\{s.diagram\}[\s\S]+className=\{s.orbitButtons\}[\s\S]+<\/div>\s*<\/div>\s*<p className=\{s.graphicNote\}/,
  );
  assert.match(
    css,
    /\.diagram\s*\{[^}]*position: relative[^}]*aspect-ratio: 1/s,
  );
  assert.doesNotMatch(css, /\.graphicNote\s*\{[^}]*position: absolute/s);
  assert.match(
    css,
    /\.orbitButtons button small\s*\{[^}]*color: var\(--atlas-label\)/s,
  );
});

test("Pace reads as a compact line without removing dated and action evidence", () => {
  const jsx = read("ReferenceAtlas.tsx"),
    css = read("ReferenceAtlas.module.css");
  assert.match(jsx, /className=\{s.actionReading\}/);
  for (const phrase of [
    "Model stance",
    "Existing holding",
    "New purchase",
    "Last completed Pace",
    "Key risk",
    "Open Pace evidence",
  ])
    assert.ok(jsx.includes(phrase), phrase);
  assert.match(css, /\.actionReading\s*\{[^}]*display: flex/s);
});

test("Atlas secondary actions opt into shared link styling rather than local panels", () => {
  const jsx = read("ReferenceAtlas.tsx");
  const css = read("ReferenceAtlas.module.css");
  assert.equal((jsx.match(/className="auryn-inline-link"/g) || []).length, 3);
  assert.match(jsx, /className="auryn-inline-link"[\s\S]*?onTab\("Pace"\)/);
  assert.doesNotMatch(css, /\.action button\s*\{/);
});
