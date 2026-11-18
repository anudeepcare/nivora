import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const css = fs.readFileSync("components/CompanyMetrics.module.css", "utf8");
test("company caution and neutral values use scoped semantic theme colors", () => {
  assert.match(
    css,
    /\.metrics[^{}]*:global\(\.metric-tone-caution\)\s*\{\s*color: var\(--amber\)/,
  );
  assert.match(
    css,
    /\.metrics[^{}]*:global\(\.metric-tone-neutral\)\s*\{\s*color: var\(--ink\)/,
  );
});
function luminance(hex) {
  return hex
    .match(/[\da-f]{2}/gi)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
}
test("existing caution and neutral tokens meet normal text contrast in light and dark", () => {
  const root = postcss.parse(fs.readFileSync("app/core/tokens.css", "utf8"));
  for (const selector of [
    ':root,\n:root[data-theme="light"]',
    ':root[data-theme="dark"]',
  ]) {
    let values = {};
    root.walkRules((r) => {
      if (r.selector === selector)
        r.walkDecls((d) => (values[d.prop] = d.value));
    });
    const rgb = (hex) => hex.match(/[\da-f]{2}/gi).map((x) => parseInt(x, 16));
    const card = rgb(values["--card"]),
      green = rgb(values["--green"]);
    values["--metric-tint"] =
      "#" +
      card
        .map((v, i) =>
          Math.round(v * 0.95 + green[i] * 0.05)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    for (const tone of ["--amber", "--ink"]) {
      for (const bg of ["--card", "--surface", "--metric-tint"]) {
        const a = luminance(values[tone]),
          b = luminance(values[bg]);
        assert.ok(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
          `${selector} ${tone}/${bg}`,
        );
      }
    }
  }
});
