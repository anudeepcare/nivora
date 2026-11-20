import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const file = "app/core/plaid-theme.css";
const shell = fs.readFileSync("components/Shell.tsx", "utf8");
test("signed-in shell explicitly adopts shared theme without replacing routes or controls", () => {
  assert.match(shell, /data-appearance="plaid"/);
  for (const existing of [
    "primary.map(nav)",
    "mobileNavigation",
    "Switch color theme",
    "Search companies and crypto",
    "Skip to content",
  ])
    assert.ok(shell.includes(existing));
  assert.match(
    fs.readFileSync("app/layout.tsx", "utf8"),
    /import "\.\/core\/plaid-theme.css"/,
  );
});
test("shared theme exports full light and dark contract with readable ink and muted text", () => {
  assert.ok(fs.existsSync(file), "new shared theme exists");
  const root = postcss.parse(fs.readFileSync(file, "utf8"));
  const sets = {};
  root.walkRules((r) => {
    if (r.selector === ":root" || r.selector === 'html[data-theme="dark"]') {
      sets[r.selector] = {};
      r.walkDecls((d) => (sets[r.selector][d.prop] = d.value));
    }
  });
  const luminance = (c) => {
    const a = c
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  for (const values of Object.values(sets)) {
    for (const token of [
      "ink",
      "muted",
      "line",
      "surface",
      "ice",
      "violet",
      "focus",
      "card-blue",
      "card-purple",
      "card-teal",
    ])
      assert.ok(values["--plaid-" + token], token);
    for (const text of ["ink", "muted"])
      for (const surface of [
        "surface",
        "ice",
        "card-blue",
        "card-purple",
        "card-teal",
      ]) {
        const a = luminance(values["--plaid-" + text]),
          b = luminance(values["--plaid-" + surface]);
        assert.ok(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
          `${text} on ${surface}`,
        );
      }
  }
  assert.equal(Object.keys(sets).length, 2);
  assert.ok(root.nodes.some((n) => n.selector === ".plaid-surface"));
});
test("desktop nav uses an integrated header and compact selected controls while phone dock geometry remains intact", () => {
  const css = postcss.parse(
    fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
  );
  const final = (selector, p) => {
    let v;
    css.walkRules((r) => {
      if (r.selector === selector) r.walkDecls(p, (d) => (v = d.value));
    });
    return v;
  };
  assert.equal(
    final('.shell[data-appearance="plaid"] .header', "border-radius"),
    "28px",
  );
  assert.equal(
    final(
      '.shell[data-appearance="plaid"] .header .nav a[aria-current="page"]',
      "background",
    ),
    "var(--plaid-ice)",
  );
  assert.equal(
    final(
      '.shell[data-appearance="plaid"] .header .nav a[aria-current="page"]::after',
      "display",
    ),
    "none",
  );
  assert.equal(
    final(".shell .dock", "grid-template-columns"),
    "repeat(5, minmax(0, 1fr))",
  );
  assert.equal(final(".shell .dock", "height"), "var(--mobile-dock-clearance)");
});
