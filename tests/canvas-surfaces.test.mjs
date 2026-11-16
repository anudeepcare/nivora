import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("public contact asks for a reply address instead of reading account email", () => {
  const s = fs.readFileSync("components/Contact.tsx", "utf8");
  assert.doesNotMatch(s, /getSession|authClient/);
  assert.match(s, /Your reply email/);
});
test("help explains price Pace separately and avoids release-specific reinstall instructions", () => {
  const s = fs.readFileSync("lib/legal-content.ts", "utf8");
  assert.match(s, /Completed month/);
  assert.doesNotMatch(
    s,
    /root status surface|October 18 status-bar|Pace uses confirmed monthly price conditions and pauses additions when severe/,
  );
});
test("common tokens and primitives load once before scoped PWA shell components", () => {
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  assert.ok(
    layout.indexOf("./core/foundation.css") <
      layout.indexOf("./core/primitives.css"),
  );
  assert.doesNotMatch(
    layout,
    /appearance.css|legacy-panels|studio-glass|mobile-glass/,
  );
  assert.match(layout, /<Pwa/);
  assert.match(
    fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
    /safe-area-inset-bottom/,
  );
});
