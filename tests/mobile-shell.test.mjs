import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("mobile shell has a distinct modern surface, safe areas and compact dock rules", () => {
  const css = fs.readFileSync("app/mobile-experience.css", "utf8");
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.phone-dock/);
  assert.match(css, /keyboard-open/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("shell markup exposes mobile-first semantics without removing desktop navigation", () => {
  const source = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.match(source, /data-shell="mobile-first"/);
  assert.match(source, /aria-label="Mobile navigation"/);
  assert.match(source, /className="app-top topbar"/);
  assert.match(source, /className="side-rail"/);
});

test("PWA syncs theme-color and preserves keyboard viewport behavior", () => {
  const source = fs.readFileSync("components/Pwa.tsx", "utf8");
  assert.match(source, /theme-color/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /keyboard-open/);
});
