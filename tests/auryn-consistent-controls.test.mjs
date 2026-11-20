import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("shared help uses a labelled native dialog and returns focus to its actual trigger", () => {
  const s = read("components/Ui.tsx");
  assert.match(s, /data-auryn-dialog="explanation"/);
  assert.match(s, /aria-expanded=\{open\}/);
  assert.match(s, /opener\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(s, /aria-labelledby=\{id\}/);
  assert.match(s, /className="auryn-dialog-content help-copy"/);
  assert.match(s, /dialog\.current\?\.showModal\(\)/);
});
test("shared light/dark control styles load after the legacy sheets and reserve mobile safe areas", () => {
  assert.ok(
    existsSync(new URL("../app/core/auryn-controls.css", import.meta.url)),
  );
  const s = read("app/layout.tsx"),
    css = read("app/core/auryn-controls.css");
  assert.ok(s.indexOf("auryn-controls.css") > s.indexOf("plaid-secondary.css"));
  assert.match(css, /dialog\[open\]/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /::backdrop/);
  assert.match(css, /prefers-reduced-transparency/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /\.table-scroll/);
});
test("main search and workspace controls declare their accessible panel names", () => {
  const s = read("components/Shell.tsx");
  assert.match(s, /data-auryn-dialog="workspace"/);
  assert.match(s, /data-auryn-dialog="search"/);
  assert.match(s, /aria-label="Account & workspace"/);
  assert.match(s, /aria-label="Search companies and crypto"/);
});
