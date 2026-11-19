import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
function tokens() {
  const out = {};
  postcss
    .parse(fs.readFileSync("app/core/tokens.css", "utf8"))
    .walkRules((r) => {
      if (r.selector === ':root[data-theme="dark"]')
        r.walkDecls((d) => (out[d.prop] = d.value));
    });
  return out;
}
const lum = (h) => {
  const a = h
    .replace("#", "")
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};
const contrast = (a, b) =>
  (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
test("dark primary secondary and semantic metric text meet strong contrast on both shared surfaces", () => {
  const t = tokens();
  for (const key of [
    "--ink",
    "--muted",
    "--control-muted",
    "--business-icon",
    "--financial-icon",
    "--valuation-icon",
    "--ownership-icon",
  ])
    for (const bg of ["--card", "--surface"])
      assert.ok(
        contrast(t[key], t[bg]) >= 7,
        `${key} on ${bg}: ${contrast(t[key], t[bg])}`,
      );
});
test("dark palette leaves light styles and financial direction meanings unchanged", () => {
  const t = tokens();
  assert.equal(t["--green"], "#79eadc");
  assert.equal(t["--red"], "#ffaca5");
  assert.equal(t["--blue"], "#5367f2");
  assert.notEqual(t["--card"], t["--surface"]);
});
