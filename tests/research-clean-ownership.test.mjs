import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) => fs.readFileSync(p, "utf8");
test("Research uses standalone frame and domain composition, not the compatibility stack", () => {
  const source = read("components/Research.tsx");
  for (const module of [
    "ResearchFrame",
    "ResearchScreens",
    "ResearchMasthead",
    "ResearchNavigation",
  ])
    assert.ok(source.includes(`${module}.module.css`));
  for (const retired of [
    "IntegratedExperience",
    "ResearchDeskLayout",
    "ResearchTabVisuals",
  ])
    assert.ok(!source.includes(retired));
  for (const id of [
    "Thesis",
    "Financials",
    "Valuation",
    "Technicals",
    "Analysts",
    "News",
    "Advanced",
    "Options",
  ])
    assert.ok(source.includes(`tab === "${id}"`), id);
  assert.ok(source.includes("data-research-section={tab}"));
  assert.ok(source.includes("aria-label={tabPresentation[tab].label}"));
});
test("rewritten tab style owners supply every directly referenced module key", () => {
  for (const [component, module, alias] of [
    ["Research", "ResearchFrame", "frame"],
    ["Research", "ResearchScreens", "screens"],
    ["TechnicalDashboard", "ResearchMetrics", "layout"],
    ["TargetsEstimates", "TargetsEstimates", "styles"],
    ["ValueStudio", "ValueStudio", "layout"],
    ["OptionsDesk", "OptionsDesk", "deskStyles"],
  ]) {
    const source = read(`components/${component}.tsx`),
      css = read(`components/${module}.module.css`);
    const keys = new Set(
      [...source.matchAll(new RegExp(`\\b${alias}\\.(\\w+)`, "g"))].map(
        (m) => m[1],
      ),
    );
    // DOMRect local named frame is unrelated to the CSS import.
    if (alias === "frame")
      for (const key of ["left", "right", "width"]) keys.delete(key);
    for (const key of keys)
      assert.ok(
        new RegExp(`\\.${key}(?![\\w-])`).test(css),
        `${component}: ${key}`,
      );
    postcss.parse(css);
  }
});
test("research styles preserve responsive controls without a local teal palette override", () => {
  const explorer = read("components/FinancialExplorer.module.css");
  assert.ok(!explorer.includes("--blue:"));
  assert.match(explorer, /min-height: 44px/);
  for (const module of [
    "ResearchScreens",
    "ResearchMetrics",
    "TargetsEstimates",
    "OptionsDesk",
  ]) {
    const css = read(`components/${module}.module.css`);
    assert.match(css, /@media \(max-width:/);
    assert.doesNotMatch(
      css,
      /\.root\.root|\.panel\.panel|\.explorer\.explorer/,
    );
  }
  const nav = read("components/ResearchNavigation.module.css");
  assert.match(nav, /overflow-x: auto/);
  assert.match(nav, /focus-visible/);
});
