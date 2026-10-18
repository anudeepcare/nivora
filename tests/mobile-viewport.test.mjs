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

test("keyboard inset keeps bottom sheets above the iPhone keyboard without adding an inset at full height", () => {
  const { keyboardInset } = load();
  assert.equal(typeof keyboardInset, "function");
  assert.equal(keyboardInset({ height: 420, offsetTop: 65 }, 850), 365);
  assert.equal(keyboardInset({ height: 850, offsetTop: 0 }, 850), 0);
});

test("viewport updates do not rewrite unchanged styles during scroll", () => {
  const { createViewportUpdater } = load();
  assert.equal(typeof createViewportUpdater, "function");
  const writes = [];
  const update = createViewportUpdater((name, value) =>
    writes.push([name, value]),
  );
  update({ height: 850, offsetTop: 0 }, 850);
  assert.equal(writes.length, 3);
  update({ height: 850, offsetTop: 0 }, 850);
  assert.equal(writes.length, 3);
  update({ height: 420, offsetTop: 65 }, 850);
  assert.equal(writes.length, 6);
});
