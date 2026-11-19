import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const lum = (h) =>
  h
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
test("selected Settings density uses contrasting solid accent, never pale dark-theme link color", () => {
  const css = postcss.parse(
    fs.readFileSync("components/SettingsPage.module.css", "utf8"),
  );
  const declarations = {};
  css.walkRules((r) => {
    if (
      r.selector ===
      '.page :global(.density-options) button[aria-pressed="true"]'
    )
      r.walkDecls((d) => (declarations[d.prop] = d.value));
  });
  assert.equal(declarations.background, "var(--accent-solid)");
  assert.equal(declarations["border-color"], "var(--accent-solid)");
  assert.equal(declarations.color, "#fff");
  const accents = postcss.parse(fs.readFileSync("app/appearance.css", "utf8"));
  const fills = [];
  accents.walkDecls("--accent-solid", (d) => {
    if (/^#[0-9a-f]{6}$/i.test(d.value)) fills.push(d.value);
  });
  assert.equal(fills.length, 4);
  for (const fill of fills)
    assert.ok(1.05 / (lum(fill) + 0.05) >= 4.5, `white on ${fill}`);
});

test("text-only accent is legible without changing button or chart blue", () => {
  const css = fs.readFileSync("app/core/table-interaction.css", "utf8");
  assert.match(css, /--accent-text: #b9ceff/);
  assert.ok((lum("#b9ceff") + 0.05) / (lum("#182334") + 0.05) >= 7);
  for (const file of [
    "components/SettingsPage.module.css",
    "components/DecisionLists.module.css",
    "components/StockScreener.module.css",
  ])
    assert.match(fs.readFileSync(file, "utf8"), /color: var\(--accent-text/);
});

test("Discover note uses theme-aware tone and compact settings get touch hit areas", () => {
  assert.match(
    fs.readFileSync("components/DiscoverWorkspace.module.css", "utf8"),
    /\.note span[^}]+color: var\(--green\)/s,
  );
  const css = fs.readFileSync("components/SettingsPage.module.css", "utf8");
  assert.match(css, /Touch targets[\s\S]+min-height: 44px/);
  assert.match(css, /motion-switch\)::after[^}]+inset: -8px -2px/s);
});

test("workspace navigation and action text uses readable accent without changing active underline", () => {
  const css = postcss.parse(
    fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
  );
  const selectors = [
    '.nav a[aria-current="page"]',
    ".nav a:hover,\n.nav button:hover",
    ".actions button:last-child",
    '.shell .dock a[aria-current="page"] svg',
  ];
  for (const selector of selectors) {
    const rule = css.nodes.find((r) => r.selector === selector);
    assert.ok(rule, selector);
    assert.equal(
      rule.nodes.find((d) => d.prop === "color").value,
      "var(--accent-text, var(--blue))",
    );
  }
  const underline = css.nodes.find(
    (r) => r.selector === '.nav a[aria-current="page"]::after',
  );
  assert.equal(
    underline.nodes.find((d) => d.prop === "background").value,
    "var(--blue)",
  );
});
