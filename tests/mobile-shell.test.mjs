import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("iOS install metadata presents AURYN as a focused standalone workspace", () => {
  const manifest = JSON.parse(fs.readFileSync("public/manifest.webmanifest", "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/overview");
  assert.equal(manifest.scope, "/");
  assert.match(JSON.stringify(manifest.display_override), /standalone/);
  assert.ok(Array.isArray(manifest.shortcuts));
});

test("mobile shell has a distinct modern surface, safe areas and compact dock rules", () => {
  const css = fs.readFileSync("app/mobile-experience.css", "utf8");
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.phone-dock/);
  assert.match(css, /keyboard-open/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("mobile chrome keeps header controls in one grid and reserves a tidy footer", () => {
  const css = fs.readFileSync("app/mobile-experience.css", "utf8");
  assert.match(css, /mobile-header-row/);
  assert.match(css, /mobile-footer-note/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) auto auto/);
  assert.match(css, /padding-bottom:\s*calc\(\s*92px/);
});

test("shell markup exposes mobile-first semantics without removing desktop navigation", () => {
  const source = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.match(source, /data-shell="mobile-first"/);
  assert.match(source, /aria-label="Mobile navigation"/);
  assert.match(source, /className="app-top topbar mobile-header-row"/);
  assert.match(source, /className="side-rail"/);
});

test("PWA syncs theme-color and preserves keyboard viewport behavior", () => {
  const source = fs.readFileSync("components/Pwa.tsx", "utf8");
  assert.match(source, /theme-color/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /keyboard-open/);
});
