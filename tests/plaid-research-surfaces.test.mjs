import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(p, "utf8");
test("Research owns a scoped layered surface without altering compact mobile identity", () => {
  const source = read("components/Research.tsx");
  assert.match(source, /plaidResearch\.root/);
  for (const component of [
    "ReferenceAtlas",
    "ValueStudio",
    "TechnicalPicture",
    "DcaResearch",
    "EventsLens",
    "IndicatorsLens",
    "OptionsDesk",
    "SentiSensePanels",
  ])
    assert.match(source, new RegExp("<" + component + "[\\s>]"));
  assert.match(source, /headerPaceStyles\.mobileName/);
  assert.match(source, /headerPaceStyles\.paceMobile/);
});
test("Every research desk has a bounded layered visual stage and readable selected nested controls", () => {
  const css = fs.existsSync("components/ResearchPlaid.module.css")
    ? read("components/ResearchPlaid.module.css")
    : "";
  for (const desk of [
    "Thesis",
    "Financials",
    "Valuation",
    "Technicals",
    "Analysts",
    "News",
    "Advanced",
    "Options",
    "Pace",
  ])
    assert.ok(css.includes(`data-research-section="${desk}"`), desk);
  assert.match(css, /box-shadow:/);
  assert.match(css, /aria-pressed="true"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /max-width: 600px/);
  assert.doesNotMatch(css, /border-top:\s*\d+px solid/);
  assert.doesNotMatch(css, /overflow:\s*hidden/);
});
test("Atlas retains real orbit and scenario readings while gaining a raised visual stage", () => {
  const css = read("components/ReferenceAtlas.module.css");
  assert.match(css, /--plaid-card-purple/);
  assert.match(css, /\.stage\.stage/);
  assert.match(css, /\.graphic\.graphic/);
  const source = read("components/ReferenceAtlas.tsx");
  assert.match(source, /research/);
  assert.doesNotMatch(source, /112\.40|\$122|\$158/);
});
test("Research chrome follows both-theme semantic tokens rather than a hardcoded legacy canvas", () => {
  const css = read("components/ResearchPlaid.module.css");
  assert.match(css, /--research-chrome:\s*var\(--plaid-surface/);
  assert.match(css, /--ink:\s*var\(--plaid-ink/);
  assert.match(css, /--research-selection-mark:\s*var\(--plaid-focus/);
});
test("Raised instrument surface targets the actual valuation and technical components", () => {
  const css = read("components/ResearchPlaid.module.css");
  assert.match(css, /\[aria-label="Selected AURYN valuation model"\]/);
  assert.match(css, /:global\(\.technical-dashboard\)/);
  assert.doesNotMatch(css, /technical-chart-shell/);
});
