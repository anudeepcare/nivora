import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const postcss = require("postcss");
const root = new URL("../", import.meta.url);
test("document safe area shares chrome rather than a detached overlay strip", () => {
  const css = fs.readFileSync(new URL("app/core/foundation.css", root), "utf8");
  const parsed = postcss.parse(css);
  let bg;
  parsed.walkRules("html", (r) =>
    r.walkDecls("background-color", (d) => (bg = d.value)),
  );
  assert.equal(bg, "var(--chrome-surface)");
  assert.doesNotMatch(css, /\.pwa-status-surface[^}]*position:\s*fixed/);
  assert.doesNotMatch(
    fs.readFileSync(new URL("app/layout.tsx", root), "utf8"),
    /pwa-shell.css|mobile-glass.css/,
  );
});

test("studio shell reserves notch space and shares browser chrome colors in both themes", () => {
  const read = (name) => fs.readFileSync(new URL(name, root), "utf8");
  const foundation = postcss.parse(read("app/core/tokens.css"));
  const colors = [];
  foundation.walkDecls("--chrome-surface", (d) => colors.push(d.value));
  assert.deepEqual(colors, ["#f5f6fa", "#111b2c"]);
  for (const file of [
    "app/layout.tsx",
    "components/Pwa.tsx",
    "components/Session.tsx",
  ]) {
    assert.ok(
      read(file).includes(colors[0]),
      `${file} must match light header`,
    );
    assert.ok(read(file).includes(colors[1]), `${file} must match dark header`);
    assert.doesNotMatch(read(file), /#171b24|#f2f4f7/);
  }
  assert.equal(
    JSON.parse(read("public/manifest.webmanifest")).theme_color,
    colors[0],
  );
  const shell = read("components/WorkspaceShell.module.css");
  assert.match(shell, /padding-top:.*safe-area-inset-top/);
  assert.match(
    shell,
    /:global\(\.keyboard-open\) \.dock\s*\{\s*display:\s*none/,
  );
  assert.match(shell, /padding-left:\s*max\(16px,\s*env\(safe-area-inset-left/);
  assert.match(read("app/layout.tsx"), /viewportFit: "cover"/);
});
