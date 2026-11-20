import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  DAYLIGHT_START,
  DAYLIGHT_END,
  DAYLIGHT_EVENT,
} from "../lib/theme-preference.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { themePreference, resolvedTheme } from "../lib/theme-preference.ts";
test("new users start in reference dark while explicit light dark and system choices survive", () => {
  assert.equal(themePreference(null), "dark");
  assert.equal(themePreference("invalid"), "dark");
  assert.equal(themePreference("light"), "light");
  assert.equal(themePreference("dark"), "dark");
  assert.equal(themePreference("system"), "system");
  assert.equal(resolvedTheme("light", true), "light");
  assert.equal(resolvedTheme("system", true), "dark");
  assert.equal(resolvedTheme("dark", false), "dark");
});

test("daylight follows local clock, preserving manual and system modes", () => {
  const at = (hour, minute = 0) => new Date(2026, 10, 20, hour, minute);
  assert.equal(themePreference("daylight"), "daylight");
  assert.equal(resolvedTheme("daylight", false, at(6, 59)), "dark");
  assert.equal(resolvedTheme("daylight", true, at(7)), "light");
  assert.equal(resolvedTheme("daylight", true, at(18, 59)), "light");
  assert.equal(resolvedTheme("daylight", false, at(19)), "dark");
  assert.equal(resolvedTheme("dark", false, at(9)), "dark");
  assert.equal(resolvedTheme("system", true, at(9)), "dark");
});

test("boot paint matches the runtime daylight schedule before hydration", () => {
  const source = readFileSync(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const boot = source
    .match(/const boot = `([^`]+)`;/)[1]
    .replace("${DAYLIGHT_START}", String(DAYLIGHT_START))
    .replace("${DAYLIGHT_END}", String(DAYLIGHT_END));
  for (const [hour, minute] of [
    [6, 59],
    [7, 0],
    [18, 59],
    [19, 0],
  ]) {
    const local = new Date(2026, 10, 20, hour, minute);
    const root = { dataset: {}, style: {} };
    const meta = { removeAttribute() {} };
    runInNewContext(boot, {
      Date: class {
        getHours() {
          return local.getHours();
        }
      },
      document: { documentElement: root, querySelectorAll: () => [meta] },
      localStorage: {
        getItem: (key) => (key === "auryn-product-theme" ? "daylight" : null),
      },
    });
    assert.equal(root.dataset.theme, resolvedTheme("daylight", false, local));
    assert.equal(root.style.colorScheme, root.dataset.theme);
    assert.equal(
      meta.content,
      root.dataset.theme === "dark" ? "#080d18" : "#f7f7f5",
    );
  }
});

test("daylight clock updates after a foreground return and leaves explicit choices alone", () => {
  const listeners = () => {
    const registered = new Map();
    return {
      registered,
      addEventListener: (name, fn) => registered.set(name, fn),
      removeEventListener: (name, fn) => {
        if (registered.get(name) === fn) registered.delete(name);
      },
    };
  };
  const events = [];
  const win = Object.assign(listeners(), {
    dispatchEvent: ({ type }) => events.push(type),
    setInterval(fn, delay) {
      assert.equal(delay, 30000);
      this.tick = fn;
      return 42;
    },
    clearInterval(id) {
      assert.equal(id, 42);
      this.tick = null;
    },
  });
  const doc = Object.assign(listeners(), {
    visibilityState: "visible",
    documentElement: { dataset: { theme: "light" } },
  });
  let saved = "daylight";
  let hour = 19;
  let cleanup;
  const source = readFileSync(
    new URL("../components/ThemeDaylightSync.tsx", import.meta.url),
    "utf8",
  );
  const component = source
    .slice(source.indexOf("export default"))
    .replace("export default ", "");
  runInNewContext(stripTypeScriptTypes(component) + "\nThemeDaylightSync();", {
    Event,
    DAYLIGHT_EVENT,
    resolvedTheme: (value, dark) =>
      resolvedTheme(value, dark, new Date(2026, 10, 20, hour)),
    useEffect: (effect) => {
      cleanup = effect();
    },
    window: win,
    document: doc,
    localStorage: { getItem: () => saved },
  });
  doc.visibilityState = "hidden";
  win.tick();
  assert.equal(doc.documentElement.dataset.theme, "light");
  assert.deepEqual(events, []);
  doc.visibilityState = "visible";
  doc.registered.get("visibilitychange")();
  assert.equal(doc.documentElement.dataset.theme, "dark");
  assert.deepEqual(events, [DAYLIGHT_EVENT]);
  saved = "dark";
  hour = 12;
  win.registered.get("focus")();
  assert.equal(doc.documentElement.dataset.theme, "dark");
  saved = "daylight";
  win.registered.get("pageshow")();
  assert.equal(doc.documentElement.dataset.theme, "light");
  cleanup();
  assert.equal(win.tick, null);
  assert.equal(win.registered.size, 0);
  assert.equal(doc.registered.size, 0);
});
