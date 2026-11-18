import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const decls = (file, selector) => {
  const result = {};
  postcss.parse(fs.readFileSync(file, "utf8")).walkRules((r) => {
    if (r.selector === selector) r.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
};
test("shared surfaces match live measured reference light and dark tokens", () => {
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
    "--muted": "#8c99ac",
    "--line": "#263247",
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
  const cta = decls("components/ReferenceAtlas.module.css", ".action button");
  assert.equal(cta.background, "var(--atlas-panel)");
  assert.equal(cta.color, "var(--atlas-ink)");
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
test("neutral Atlas action retains accessible contrast, focus and real Pace navigation in both themes", () => {
  const file = "components/ReferenceAtlas.module.css";
  const action = decls(file, ".action button");
  assert.equal(action["min-height"], "44px");
  assert.equal(
    decls(file, ".action button:hover").background,
    "var(--atlas-mid)",
  );
  assert.equal(
    decls(file, ".action button:focus-visible").outline,
    "2px solid var(--atlas-cyan)",
  );
  const light = decls(file, ".atlas");
  const dark = {
    ...light,
    ...decls(file, ':global([data-theme="dark"]) .atlas'),
  };
  for (const palette of [light, dark]) {
    const expand = (x) =>
      x.length === 4
        ? "#" +
          x
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
        : x;
    const ink = expand(palette["--atlas-ink"]),
      surface = expand(palette["--atlas-panel"]);
    assert.ok(contrast(ink, surface) >= 4.5);
    assert.ok(contrast(ink, expand(palette["--atlas-mid"])) >= 4.5);
    assert.ok(contrast(expand(palette["--atlas-cyan"]), surface) >= 3);
  }
  const view = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(view, /<button onClick=\{\(\) => onTab\("Pace"\)\}>/);
  assert.match(view, /Open Pace evidence/);
});
