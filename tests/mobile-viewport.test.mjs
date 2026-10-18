import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  const exports = {};
  const path = "lib/mobile-viewport.ts";
  if (!fs.existsSync(path)) return {};
  new Function(
    "exports",
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(exports);
  return exports;
}
test("mobile overlay uses visual viewport after the keyboard reduces visible height", () => {
  const { visibleViewport } = load();
  assert.equal(typeof visibleViewport, "function");
  assert.deepEqual(visibleViewport({ height: 420, offsetTop: 65 }, 850), {
    height: 420,
    top: 65,
  });
  assert.deepEqual(visibleViewport(null, 850), { height: 850, top: 0 });
});
test("invalid viewport readings cannot collapse or move an overlay offscreen", () => {
  const { visibleViewport } = load();
  assert.equal(typeof visibleViewport, "function");
  assert.deepEqual(visibleViewport({ height: NaN, offsetTop: -90 }, 850), {
    height: 850,
    top: 0,
  });
});
