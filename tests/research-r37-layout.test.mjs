import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) =>
  fs.readFileSync(new URL("../components/" + file, import.meta.url), "utf8");
test("research stage distinguishes identity from selected views without cutting off labels", () => {
  const css = read("ReferenceCockpit.module.css");
  assert.match(
    css,
    /\.root\[data-active-lens\] > header\s*\{[^}]*background:\s*transparent/,
  );
  assert.match(
    css,
    /\.root\[data-active-lens\] > \.lenses\s*\{[^}]*flex-wrap:\s*wrap/,
  );
  assert.match(
    css,
    /\.root\[data-active-lens\] > \.lenses button\[aria-current="page"\]::after\s*\{\s*content:\s*none/,
  );
});
test("event panels align on one grid and indicator risk is allocated a full rail", () => {
  const page = read("DirectResearchLenses.tsx");
  assert.match(page, /className=\{s\.eventsSupporting\}/);
  assert.match(page, /className=\{s\.indicatorSupporting\}/);
  const css = read("DirectResearchLenses.module.css");
  assert.match(
    css,
    /\.eventsSupporting > :global\(\.earnings-workspace\)\s*\{[^}]*margin:\s*0/,
  );
  assert.match(
    css,
    /\.indicatorSupporting\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /\.indicatorSupporting[^{}]*professional-tabs[^{}]*\{[^}]*flex-wrap:\s*wrap/,
  );
});
test("source metadata has semantically distinct date and count fields", () => {
  const panel = read("SentiSensePanels.tsx");
  assert.match(panel, /<dl className=\{s.provenanceFields\}>/);
  for (const label of ["Source", "Evidence date", "Retrieved", "Coverage"])
    assert.ok(panel.includes("<dt>" + label + "</dt>"), label);
  assert.match(panel, /<time dateTime=/);
  assert.match(
    read("SentiSensePanels.module.css"),
    /\.provenanceFields\s*\{[^}]*display:\s*grid/,
  );
});
