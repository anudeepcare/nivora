import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as mobile from "../lib/mobile-viewport.ts";
class Events {
  listeners = new Map();
  addEventListener(name, cb) {
    this.listeners.set(name, cb);
  }
  removeEventListener(name) {
    this.listeners.delete(name);
  }
  emit(name) {
    this.listeners.get(name)?.();
  }
}
class Element {
  isContentEditable = false;
  matches() {
    return true;
  }
}
test("PWA mounted with an already-open keyboard hides navigation and restores it after dismissal", () => {
  const viewport = Object.assign(new Events(), { height: 420, offsetTop: 0 });
  const window = Object.assign(new Events(), {
    visualViewport: viewport,
    innerHeight: 812,
    innerWidth: 402,
  });
  const classes = new Set(),
    styles = new Map(),
    effects = [],
    frames = new Map();
  let nextFrame = 0;
  const document = Object.assign(new Events(), {
    activeElement: new Element(),
    documentElement: {
      style: { setProperty: (k, v) => styles.set(k, v) },
      classList: {
        toggle: (k, on) => (on ? classes.add(k) : classes.delete(k)),
        remove: (k) => classes.delete(k),
      },
    },
  });
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync("components/Pwa.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function(
    "exports",
    "require",
    "window",
    "document",
    "HTMLElement",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    code,
  )(
    exports,
    (name) =>
      name === "react" ? { useEffect: (fn) => effects.push(fn) } : mobile,
    window,
    document,
    Element,
    (fn) => {
      frames.set(++nextFrame, fn);
      return nextFrame;
    },
    (id) => frames.delete(id),
  );
  exports.default();
  const dispose = effects[0]();
  const flush = () => {
    for (const [id, fn] of frames) {
      frames.delete(id);
      fn();
    }
  };
  flush();
  assert.equal(classes.has("keyboard-open"), true);
  assert.equal(styles.get("--visual-height"), "420px");
  viewport.height = 812;
  viewport.emit("resize");
  flush();
  assert.equal(classes.has("keyboard-open"), false);
  viewport.height = 420;
  viewport.emit("resize");
  flush();
  assert.equal(classes.has("keyboard-open"), true);
  document.activeElement = null;
  document.emit("focusout");
  flush();
  assert.equal(classes.has("keyboard-open"), false);
  dispose();
  assert.equal(viewport.listeners.size, 0);
  assert.equal(document.listeners.size, 0);
  assert.equal(window.listeners.size, 0);
});
