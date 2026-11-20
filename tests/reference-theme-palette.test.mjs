import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const decls = (file, selector, media) => {
  const result = {};
  postcss.parse(fs.readFileSync(file, "utf8")).walkRules((r) => {
    if (
      r.selector === selector &&
      (media ? r.parent.params === media : r.parent.type === "root")
    )
      r.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
};
test("shared surfaces preserve light reference and intentional dark readability palette", () => {
  const f = "app/core/tokens.css";
  const light = decls(f, ':root,\n:root[data-theme="light"]');
  const dark = decls(f, ':root[data-theme="dark"]');
  for (const [k, v] of Object.entries({
    "--app-background": "#f7f7f5",
    "--card": "#ffffff",
    "--ink": "#171c27",
    "--muted": "#626a78",
    "--line": "#dfe1e5",
  }))
    assert.equal(light[k], v, k);
  for (const [k, v] of Object.entries({
    "--app-background": "#080d18",
    "--card": "#0f1827",
    "--ink": "#eef2f8",
    "--muted": "#bdc9da",
    "--line": "#42516a",
    "--control-card": "#101a29",
    "--control-ink": "#dfe5ef",
  }))
    assert.equal(dark[k], v, k);
});
test("nav and research have explicit reference surface and active-state distinctions", () => {
  const shell = decls("components/WorkspaceShell.module.css", ".shell");
  assert.equal(shell["--nav-ink"], "#687488");
  assert.equal(shell["--nav-control-line"], "#d7dde7");
  const dark = decls(
    "components/WorkspaceShell.module.css",
    ':global([data-theme="dark"]) .shell',
  );
  assert.equal(dark["--nav-ink"], "#7f8da3");
  assert.equal(dark["--nav-active"], "#fff");
  const research = decls("components/ReferenceCockpit.module.css", ".root");
  assert.equal(research.background, "#edf1f6");
  assert.equal(research["--research-chrome"], "#f8fafc");
  const cta = decls(
    "app/core/auryn-controls.css",
    "#auryn-app .auryn-inline-link",
  );
  assert.equal(cta.background, "transparent");
  assert.equal(cta.border, "0");
  assert.equal(
    cta.color,
    "var(--plaid-link, var(--plaid-focus, currentColor))",
  );
});

const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
test("Atlas evidence link retains contrast, keyboard affordance, mobile touch size and real Pace navigation", () => {
  const file = "components/ReferenceAtlas.module.css";
  const controls = "app/core/auryn-controls.css";
  const theme = "app/core/plaid-theme.css";
  const selector = "#auryn-app .auryn-inline-link";
  assert.equal(
    decls(controls, selector, "(max-width: 767px)")["min-height"],
    "44px",
  );
  assert.equal(
    decls(controls, selector + ":hover,\n" + selector + ":focus-visible")[
      "text-decoration"
    ],
    "underline",
  );
  const light = decls(file, ".atlas");
  const dark = {
    ...light,
    ...decls(file, ':global([data-theme="dark"]) .atlas'),
  };
  for (const [palette, appearance] of [
    [light, decls(theme, ":root")],
    [dark, decls(theme, 'html[data-theme="dark"]')],
  ]) {
    const expand = (x) =>
      x.length === 4
        ? "#" +
          x
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
        : x;
    const ink = expand(palette["--atlas-ink"]);
    const surfaces = [
      palette["--atlas-panel"],
      palette["--atlas-mid"],
      appearance["--plaid-card-purple"],
      appearance["--plaid-card-blue"],
    ].map(expand);
    for (const surface of surfaces) {
      assert.ok(contrast(ink, surface) >= 4.5);
      assert.ok(
        contrast(appearance["--plaid-link"], surface) >= 4.5,
        "link contrast on Atlas surfaces",
      );
      assert.ok(
        contrast(palette["--atlas-label"], surface) >= 4.5,
        "orbit caption contrast",
      );
    }
    assert.ok(contrast(expand(palette["--atlas-cyan"]), surfaces[0]) >= 3);
  }
  const view = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(
    view,
    /<button\s+className="auryn-inline-link"\s+type="button"\s+onClick=\{\(\) => onTab\("Pace"\)\}\s*>\s*Open Pace evidence/,
  );
});
