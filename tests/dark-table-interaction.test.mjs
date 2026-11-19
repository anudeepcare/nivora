import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const file = "app/core/table-interaction.css";
const css = fs.readFileSync(file, "utf8");
const rules = [];
postcss.parse(css).walkRules((r) => {
  const decl = {};
  r.walkDecls((d) => (decl[d.prop] = d.value));
  rules.push({
    selector: r.selector.replace(/\s+/g, " "),
    decl,
    forced: r.parent.type === "atrule",
  });
});
const lum = (h) => {
  const a = h
    .replace("#", "")
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};
const ratio = (a, b) =>
  (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
test("dark cell hover covers sticky cells and keyboard focus rather than only tr backgrounds", () => {
  const r = rules.find(
    (r) =>
      !r.forced &&
      r.selector.includes(
        "table tbody tr:is(:hover, :focus-within) > :is(th, td)",
      ) &&
      !r.selector.includes(" a"),
  );
  assert.ok(r);
  assert.equal(r.decl.background, "var(--table-hover-surface)");
  assert.ok(r.selector.includes("#auryn-app"));
  assert.equal(r.decl["--ink"], "var(--table-hover-ink)");
  assert.doesNotMatch(css, /text-align/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
});
test("dark search pointer and keyboard option selection have explicit foreground and secondary colors", () => {
  const r = rules.find(
    (r) =>
      !r.forced &&
      r.selector.endsWith(
        'button:is(:hover, :focus-visible, [aria-selected="true"])',
      ),
  );
  assert.equal(r.decl.background, "var(--table-hover-surface)");
  assert.equal(r.decl.color, "var(--table-hover-ink)");
  assert.equal(
    r.decl["box-shadow"],
    "none",
    "selection must not draw an accent stripe",
  );
  assert.match(css, /\[aria-selected="true"\]\)\s+small/);
  assert.match(css, /--blue-soft: #283957/);
});
test("hover is visibly different with readable labels and links, scoped dark only and last stylesheet", () => {
  const t = rules.find((r) => r.decl["--table-hover-surface"]).decl;
  assert.ok(ratio(t["--table-hover-surface"], "#182334") >= 1.4);
  for (const c of [t["--table-hover-ink"], t["--table-hover-muted"], "#b9ceff"])
    assert.ok(ratio(c, t["--table-hover-surface"]) >= 7);
  for (const r of rules.filter((r) => r.selector !== ":root"))
    assert.ok(r.selector.includes('[data-theme="dark"]'));
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  assert.ok(
    layout.indexOf("table-interaction.css") >
      layout.indexOf("mobile-glass.css"),
  );
});
