import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
import { accents } from "../lib/appearance.ts";
const read = (p) => fs.readFileSync(p, "utf8");
const block = (s, selector) => s.slice(s.indexOf(selector)).split("}")[0];
const token = (s, key) => s.match(new RegExp(`--${key}: (#[a-f0-9]{6});`))?.[1];
const luminance = (h) =>
  h
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) /
  (Math.min(luminance(a), luminance(b)) + 0.05);
test("Studio accent settings and rendered accent agree in both themes", () => {
  const css = read("app/appearance.css");
  for (const [selector, value] of [
    [':root[data-accent="blue"]', accents.blue.light],
    [':root[data-theme="dark"][data-accent="blue"]', accents.blue.dark],
  ])
    assert.equal(token(block(css, selector), "blue"), value);
});
test("brand canvas uses ivory and navy studio surfaces with readable semantic text", () => {
  const css = read("app/core/tokens.css");
  for (const [selector, bg] of [
    [':root[data-theme="light"]', "#f5f2eb"],
    [':root[data-theme="dark"]', "#10202a"],
  ]) {
    const t = block(css, selector);
    assert.equal(token(t, "bg"), bg);
    for (const name of [
      "ink",
      "muted",
      "positive",
      "negative",
      "neutral",
      "warning",
    ])
      for (const surface of ["card", "surface"])
        assert.ok(
          contrast(token(t, name), token(t, surface)) >= 4.5,
          `${selector}: ${name} on ${surface}`,
        );
  }
});
test("portfolio return has an explicit sign-based tone and missing values remain neutral", () => {
  const source = read("components/PortfolioPage.tsx");
  assert.match(
    source,
    /data-return-tone=\{[\s\S]*?!workspace \|\| !quotes\.ready \|\| model\.pnl == null[\s\S]*?"neutral"[\s\S]*?model\.pnl < 0[\s\S]*?"negative"[\s\S]*?model\.pnl > 0[\s\S]*?"positive"/,
  );
  const css = read("components/PortfolioWorkspace.module.css");
  assert.match(
    css,
    /\[data-return-tone="negative"\] strong[\s\S]*?color: var\(--negative\)/,
  );
  assert.match(
    css,
    /\[data-return-tone="positive"\] strong[\s\S]*?color: var\(--positive\)/,
  );
});
test("valuation removes only the Test assumptions shortcut while keeping model tools", () => {
  const source = read("components/ValueStudio.tsx");
  assert.doesNotMatch(source, /Test assumptions/);
  for (const tag of [
    "StockPillars",
    "ScenarioLenses",
    "DecisionInsights",
    "PriceProjection",
    "TargetsEstimates",
  ])
    assert.match(source, new RegExp(`<${tag}`));
});
test("studio top navigation has an amber underline and loading keeps a separate status dot", () => {
  const css = read("components/WorkspaceShell.module.css");
  const effective = {};
  postcss.parse(css).walkAtRules("media", rule => {
    if(rule.params !== "(min-width: 1000px)") return;
    rule.walkRules(r => { const values = effective[r.selector] ||= {}; r.walkDecls(d => values[d.prop] = d.value); });
  });
  assert.equal(effective[".shell .header"].position, "sticky");
  assert.equal(effective[".shell .header"]["flex-direction"], "row");
  const underline=effective['.shell .header .nav a[aria-current="page"]::after'];
  assert.equal(underline.height,"2px");
  assert.equal(underline.background,"#edc17c");
  assert.match(css, /\.routePending[^}]+width: 6px/);
});
test("changed offline palette is installed as a fresh shell version", () => {
  assert.match(
    read("public/sw.js"),
    /const OFFLINE_CACHE = "auryn-offline-v9"/,
  );
  assert.match(
    read("app/layout.tsx"),
    /manifest.webmanifest\?v=20261115-studio/,
  );
});
test("optional appearance accents continue to color navigation with readable selected text", () => {
  const css = read("app/appearance.css");
  for (const name of ["teal", "violet", "rose"]) {
    const t = block(css, `:root[data-accent="${name}"]`);
    assert.match(t, /--nav-active: var\(--accent-solid\)/);
    assert.equal(token(t, "nav-active-ink"), "#ffffff");
    assert.ok(contrast(accents[name].solid, "#ffffff") >= 4.5);
  }
});
