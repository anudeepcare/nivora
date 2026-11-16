import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("iOS install metadata presents AURYN as a focused standalone workspace", () => {
  const manifest = JSON.parse(
    fs.readFileSync("public/manifest.webmanifest", "utf8"),
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/overview");
  assert.equal(manifest.scope, "/");
  assert.match(JSON.stringify(manifest.display_override), /standalone/);
  assert.ok(Array.isArray(manifest.shortcuts));
});

test("mobile shell owns safe-area header, bottom dock and keyboard clearance", () => {
  const css = fs.readFileSync("components/WorkspaceShell.module.css", "utf8");
  for (const term of [
    "safe-area-inset-top",
    "safe-area-inset-bottom",
    ".dock",
    ".keyboard-open",
    "min-height: 44px",
    "position: fixed",
  ])
    assert.ok(css.includes(term));
  assert.match(css, /:global\(\.keyboard-open\) \.dock\s*\{\s*display: none/);
  assert.match(
    fs.readFileSync("app/core/foundation.css", "utf8"),
    /overflow-x: clip/,
  );
});
test("mobile chrome keeps identifiable brand, selected navigation and accessible tool dialogs", () => {
  const css = fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
    source = fs.readFileSync("components/Shell.tsx", "utf8");
  for (const term of [
    ".brand",
    ".toolsDialog",
    ".searchDialog",
    "backdrop-filter: blur",
    '.dock a[aria-current="page"]',
  ])
    assert.ok(css.includes(term));
  for (const label of [
    "AURYN home",
    "Close tools",
    "Close search",
    "Price alerts",
  ])
    assert.ok(source.includes(label));
  assert.match(css, /calc\(88px \+ env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(
    fs.readFileSync("components/Product.tsx", "utf8"),
    /compatibility.css/,
  );
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
