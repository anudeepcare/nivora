import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../components/PublicLanding.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../components/PublicLanding.module.css", import.meta.url),
  "utf8",
);
test("public entry has a complete keyboard-operable guide and clear auth routes", () => {
  for (const value of [
    'role="tablist"',
    'role="tabpanel"',
    "aria-selected",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "/login?mode=signup",
    "/login",
  ])
    assert.ok(source.includes(value), value);
});
test("public guide does not make a market-data claim", () => {
  assert.match(source, /Product guide · not live data/);
  assert.match(source, /not live recommendations/);
  assert.doesNotMatch(source, /\/research\/NOW/);
});
test("public entry has scoped responsive controls and no browser-default footer button", () => {
  assert.match(css, /\.footer button\s*\{/);
  assert.match(css, /@media \(max-width: 650px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(source, /Skip to content/);
});
