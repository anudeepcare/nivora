import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const sheet = postcss.parse(
  fs.readFileSync("components/HomeWorkspace.module.css", "utf8"),
);
const declarations = (selector, prop) => {
  const values = [];
  sheet.walkRules((r) => {
    if (r.selector === selector) r.walkDecls(prop, (d) => values.push(d.value));
  });
  return values;
};
const luminance = (hex) => {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
test("Today evidence panels stretch within their grid without a stale self-alignment override", () => {
  assert.equal(
    declarations(
      ".home.home.home :global(.home-evidence-layout)",
      "align-items",
    ).at(-1),
    "stretch",
  );
  assert.ok(
    declarations(
      ".home.home.home :global(.home-evidence-panel)",
      "align-self",
    ).every((v) => v === "stretch" || v === "auto"),
  );
});
test("Today event date badge pairs pale accent background with a readable foreground in both themes", () => {
  const selector = ".home.home.home :global(.home-event-day) > time";
  assert.equal(declarations(selector, "background").at(-1), "var(--blue-soft)");
  assert.equal(declarations(selector, "color").at(-1), "var(--date-badge-ink)");
  assert.equal(declarations(".home", "--date-badge-ink").at(-1), "var(--ink)");
  // Resolve actual default-theme tokens in load order, including the final dark override.
  for (const theme of ["light", "dark"]) {
    const values = {};
    for (const path of [
      "app/core/tokens.css",
      "app/core/table-interaction.css",
    ]) {
      postcss.parse(fs.readFileSync(path, "utf8")).walkRules((r) => {
        const applicable = r.selector
          .split(",")
          .map((x) => x.trim())
          .some(
            (x) =>
              x === ":root" ||
              x === `:root[data-theme="${theme}"]` ||
              (theme === "dark" &&
                x === ':root[data-theme="dark"]:not([data-accent])'),
          );
        if (applicable)
          r.walkDecls((d) => {
            values[d.prop] = d.value;
          });
      });
    }
    const fg = values["--ink"],
      bg = values["--blue-soft"];
    assert.match(fg, /^#[0-9a-f]{6}$/i);
    assert.match(bg, /^#[0-9a-f]{6}$/i);
    const a = luminance(fg),
      b = luminance(bg);
    assert.ok(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
      theme + " actual badge contrast",
    );
  }
});
