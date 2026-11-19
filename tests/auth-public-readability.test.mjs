import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (component) =>
  readFileSync(new URL(`../components/${component}.module.css`, import.meta.url), "utf8");
const auth = read("Session");
const frame = read("PublicFrame");

function luminance(hex) {
  const linear = (value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return hex.match(/../g).map(linear).reduce((sum, channel, index) =>
    sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

test("authentication link ink is readable on the actual light and dark form surfaces", () => {
  const inks = [...auth.matchAll(/--auth-link-ink: #([0-9a-f]{6})/g)].map((m) => m[1]);
  assert.equal(inks.length, 2);
  assert.match(auth, /mp-inline-link\) \{[^}]*color: var\(--auth-link-ink\)/);
  assert.match(auth, /\.main \{[^}]*background: #fff/);
  assert.match(auth, /data-theme="dark"[^]*?\.auth \.main \{[^}]*background: #0b121f/);
  for (const [foreground, background] of [[inks[0], "ffffff"], [inks[1], "0b121f"]]) {
    const levels = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5);
  }
});

test("auth fields and narrow public navigation retain readable sizes and touch targets", () => {
  assert.match(auth, /mp-form-field input\) \{[^}]*font-size: 16px/);
  assert.match(auth, /\.remember label \{[^}]*min-height: 44px/);
  assert.match(frame, /@media \(max-width: 700px\)[^]*?\.header nav a \{[^}]*min-height: 44px/);
  assert.match(frame, /\.summary strong \{[^}]*font-variant-numeric: tabular-nums/);
});
