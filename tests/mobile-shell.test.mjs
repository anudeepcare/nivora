import { readCompatCss } from './read-compat-css.mjs';
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
  const css = readCompatCss('app/mobile-experience.css');
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.phone-dock/);
  assert.match(css, /keyboard-open/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("mobile chrome keeps a brand-led glass header and reserves a tidy footer", () => {
  const css = readCompatCss('app/mobile-experience.css');
  const finalCss = readCompatCss('app/mobile-final.css');
  const pwaCss = readCompatCss('app/pwa-shell.css');
  const layout = fs.readFileSync("app/core/compatibility.css", "utf8");
  assert.match(css, /mobile-header-row/);
  assert.match(css, /mobile-footer-note/);
  assert.match(css, /mobile-header-row\s*\{[\s\S]*display:\s*flex/);
  assert.match(finalCss, /mobile-brand-mark/);
  assert.match(finalCss, /mobile-header-row \.wordmark[\s\S]*position:\s*static/);
  assert.match(finalCss, /wordmark-label[\s\S]*display:\s*inline/);
  assert.match(finalCss, /Price alerts/);
  assert.match(finalCss, /top-links\s*>\s*\.mobile-explore[\s\S]*display:\s*inline-flex/);
  assert.match(finalCss, /top-links\s*>\s*\.header-plans[\s\S]*display:\s*none/);
  assert.match(css, /padding-bottom:\s*calc\(\s*92px/);
  assert.match(layout, /@import "\.\/legacy-panels\.css"/);
  assert.ok(finalCss.length > 0);
  assert.match(finalCss, /backdrop-filter:\s*blur/);
  assert.match(finalCss, /saturate\(/);
  assert.match(finalCss, /approved-tools-dialog/);
  assert.match(finalCss, /search-dialog/);
  assert.match(finalCss, /mobile-header-row[\s\S]*border-bottom:\s*0/);
  assert.match(finalCss, /mobile-header-row[\s\S]*box-shadow:\s*none/);
  assert.match(pwaCss, /pwa-status-surface[\s\S]*var\(--auryn-mobile-glass/);
  assert.doesNotMatch(pwaCss, /pwa-status-surface[\s\S]*background:\s*var\(--paper\)/);
  assert.match(finalCss, /workspace-rail[\s\S]*display:\s*none/);
  assert.match(finalCss, /--auryn-mobile-glass/);
});

test("shell markup exposes mobile-first semantics without removing desktop navigation", () => {
  const source = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.match(source, /data-shell="mobile-first"/);
  assert.match(source, /aria-label="Mobile navigation"/);
  assert.match(source, /className={experience.header}/);
  assert.match(source, /aria-label="Main navigation"/);
});

test("PWA syncs theme-color and preserves keyboard viewport behavior", () => {
  const source = fs.readFileSync("components/Pwa.tsx", "utf8");
  assert.match(source, /theme-color/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /keyboard-open/);
  assert.match(source, /registration\.update\(\)/);
});

test("Pace guidance keeps gated Review labels mapped to the business gate", () => {
  const source = fs.readFileSync("components/PaceGuidance.tsx", "utf8");
  assert.match(source, /view\.actionLabel\.startsWith\("Review"\)/);
});
