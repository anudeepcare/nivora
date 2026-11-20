import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("compact desktop navigation shares a visible equal-track row instead of clipping tab labels", () => {
  const css = read("components/WorkspaceShell.module.css");
  const compact = css
    .split("/* Compact desktop fit */")[1]
    ?.split("/* Phone shell fit */")[0];
  assert.ok(compact);
  assert.match(compact, /min-width: 768px.*max-width: 1080px/);
  assert.match(compact, /repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(compact, /overflow: visible/);
  assert.match(compact, /flex-direction: column/);
  assert.match(compact, /min-height: 44px/);
});
test("phone dock keeps five visible targets and does not cover keyboard focus", () => {
  const css = read("components/WorkspaceShell.module.css").split(
    "/* Phone shell fit */",
  )[1];
  assert.ok(css);
  assert.match(
    css,
    /scroll-margin-bottom:[\s\S]*var\(--mobile-dock-clearance\)/,
  );
  assert.match(css, /data-keyboard-open="true"[\s\S]*display: none/);
  const nav = read("lib/reference-navigation.ts");
  for (const label of [
    "Today",
    "Research",
    "Screener",
    "Watchlist",
    "Portfolio",
  ])
    assert.match(nav, new RegExp(label));
});
