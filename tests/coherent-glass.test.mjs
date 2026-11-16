import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
test("financial semantics share theme-aware colors, independent of accent", () => {
  const tokens = read("app/core/tokens.css");
  for (const name of [
    "positive",
    "negative",
    "neutral",
    "warning",
    "workspace-control",
    "workspace-tile",
    "workspace-panel",
  ])
    assert.match(tokens, new RegExp(`--${name}:`));
  for (const file of [
    "StockPillars",
    "ScenarioLenses",
    "SelectedValuation",
    "AnalystTargets",
  ]) {
    const css = read(`components/${file}.module.css`);
    assert.doesNotMatch(
      css,
      /#(?:c65050|a38232|00866b)/i,
      file + " must not bypass semantic tokens",
    );
  }
});
test("disclosure rows no longer receive an opaque surface when expanded", () => {
  const source = read("components/DetailDialog.tsx");
  assert.match(source, /createPortal/);
  assert.match(source, /element.showModal\(\)/);
  assert.doesNotMatch(
    read("components/DetailDialog.module.css"),
    /details\[open\]/,
  );
});
test("overview uses coordinated paired panels, not margins inside a gap grid", () => {
  const css = read("components/ResearchOverview.module.css");
  assert.match(
    css,
    /\.caseWorkspace[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/s,
  );
  assert.match(
    read("components/StockPillars.module.css"),
    /\.root \{[^}]*margin: 0;/,
  );
});
test("studio semantic text colors meet AA on actual light and dark surface tokens", () => {
  const lum = (h) => {
    const a = h
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const tokens = read("app/core/tokens.css");
  for (const selector of [
    ':root[data-theme="light"]',
    ':root[data-theme="dark"]',
  ]) {
    const block = tokens.slice(tokens.indexOf(selector)).split("}")[0];
    const background = block.match(/--surface: (#[a-f0-9]{6});/)?.[1];
    assert.ok(background, "Theme surface must be defined");
    for (const name of [
      "ink",
      "muted",
      "positive",
      "negative",
      "neutral",
      "warning",
    ]) {
      const color = block.match(new RegExp(`--${name}: (#[a-f0-9]{6});`))?.[1];
      assert.ok(color, `${selector} ${name} exists`);
      const a = lum(color),
        b = lum(background),
        ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(
        ratio >= 4.5,
        `${selector} ${name} contrast ${ratio.toFixed(2)}`,
      );
    }
  }
});
test("surface colors never use geometry tokens or invalid unitless gradient stops", () => {
  for (const file of [
    "WorkspaceShell",
    "SelectedValuation",
    "StockPillars",
    "PriceRiskCases",
    "ScenarioLenses",
    "ResearchEvidenceGrid",
  ]) {
    const css = read(`components/${file}.module.css`);
    assert.doesNotMatch(
      css,
      /background(?:-color)?: var\(--workspace-(?:inset|gap|radius)\)/,
      file,
    );
    assert.doesNotMatch(
      css,
      /var\(--(?:positive|negative|neutral)\)\s+\d+(?=\s*[,\n])/,
      file,
    );
  }
});
test("embedded consensus owns a higher-specificity transparent surface", () => {
  assert.match(
    read("components/IntegratedResearch.tsx"),
    /<AnalystTargets research=\{r\} embedded/,
  );
  assert.match(
    read("components/AnalystTargets.module.css"),
    /\.root\.root\.root\[data-embedded="true"\][^}]*background: transparent/s,
  );
});
test("expanded business checks size to their panel rather than the viewport", () => {
  assert.match(
    read("components/StockPillars.module.css"),
    /repeat\(auto-fit, minmax\(min\(100%, 240px\), 1fr\)\)/,
  );
});
test("reduced-transparency fallback has equal theme specificity", () => {
  const fallback = read("app/core/tokens.css").split(
    "@media (prefers-reduced-transparency: reduce)",
  )[1];
  assert.match(fallback, /:root\[data-theme="light"\]/);
  assert.match(fallback, /:root\[data-theme="dark"\]/);
  assert.match(fallback, /--workspace-panel: var\(--card\)/);
});
