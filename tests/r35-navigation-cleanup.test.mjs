import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (file) => fs.readFileSync(file, "utf8");
test("workspace menus exclude Alerts but keep alert settings, routes and primary controls", () => {
  const shell = read("components/Shell.tsx");
  assert.doesNotMatch(
    shell,
    /Price alerts|path: "alerts"|\$\{prefix\}\/alerts/,
  );
  assert.match(shell, /aria-label="Mobile navigation"/);
  assert.match(shell, /aria-label="Main navigation"/);
  assert.match(shell, /primary\.map\(nav\)/);
  assert.match(
    read("components/SettingsExperience.tsx"),
    /Set up in-app alerts/,
  );
  assert.match(read("components/Product.tsx"), /import\("\.\/AlertCenter"\)/);
});
test("desktop chrome uses the workspace surface and a compact inset", () => {
  const css = postcss.parse(read("components/WorkspaceShell.module.css"));
  const values = {};
  css.walkRules((rule) => {
    if (
      rule.selector === '.shell[data-appearance="plaid"] .header' &&
      rule.parent.type === "atrule" &&
      rule.parent.params === "(min-width: 768px)"
    )
      rule.walkDecls((decl) => (values[decl.prop] = decl.value));
  });
  assert.equal(values.background, "var(--plaid-surface)");
  assert.equal(values["border-radius"], "28px");
  assert.equal(values.top, "8px");
  assert.equal(values["padding-inline"], "var(--workspace-inset)");
});
test("research section navigation blends into its stage without decorative bars", () => {
  const source = read("components/ReferenceCockpit.module.css");
  assert.match(
    source,
    /\.root\[data-active-lens\] > \.lenses\s*\{[^}]*border-top:\s*0/s,
  );
  assert.match(
    source,
    /\.root\[data-active-lens\] > \.lenses button\[aria-current="page"\]::after\s*\{\s*content:\s*none/s,
  );
  assert.match(
    source,
    /\.root\[data-active-lens\] > \.lenses button\[aria-current="page"\][\s\S]*background:\s*var\(--plaid-ice/,
  );
});
