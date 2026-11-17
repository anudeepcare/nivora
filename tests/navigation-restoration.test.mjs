import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function navigation(window, document) {
  if (!fs.existsSync("lib/navigation.ts")) return {};
  const code = ts.transpileModule(
    fs.readFileSync("lib/navigation.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "window", "document", code)(
    module,
    module.exports,
    window,
    document,
  );
  return module.exports;
}
function viewport() {
  let max = 100,
    loading = false,
    onResize,
    onIntent,
    timer;
  const moves = [];
  return {
    moves,
    grow(value) {
      max = value;
      onResize?.();
    },
    loading(value) {
      loading = value;
      onResize?.();
    },
    intent() {
      onIntent?.();
    },
    expire() {
      timer?.();
    },
    env: {
      isSettled: () => !loading,
      maxScroll: () => max,
      scrollTo: (y) => moves.push(y),
      observe: (callback) => {
        onResize = callback;
        return () => {
          onResize = undefined;
        };
      },
      onIntent: (callback) => {
        onIntent = callback;
        return () => {
          onIntent = undefined;
        };
      },
      delay: (callback) => {
        timer = callback;
        return () => {
          timer = undefined;
        };
      },
    },
  };
}
test("saved scroll waits for async list content instead of being clamped by its loading state", () => {
  const { restoreWhenReady } = navigation();
  assert.equal(typeof restoreWhenReady, "function");
  const v = viewport();
  restoreWhenReady(720, v.env);
  assert.deepEqual(v.moves, []);
  v.grow(1400);
  assert.deepEqual(v.moves, [720]);
  v.grow(1600);
  assert.deepEqual(v.moves, [720]);
});

test("slow data beyond the deadline still restores the saved list position after loading settles", () => {
  const { restoreWhenReady } = navigation();
  const v = viewport();
  v.loading(true);
  restoreWhenReady(720, v.env);
  v.expire();
  assert.deepEqual(v.moves, []);
  v.grow(1400);
  assert.deepEqual(v.moves, []);
  v.loading(false);
  assert.deepEqual(v.moves, [720]);
});
test("a deliberate gesture cancels pending restoration and avoids a late jump", () => {
  const { restoreWhenReady } = navigation();
  assert.equal(typeof restoreWhenReady, "function");
  const v = viewport();
  restoreWhenReady(720, v.env);
  v.intent();
  v.grow(1400);
  v.expire();
  assert.deepEqual(v.moves, []);
});
test("navigation ledger preserves distinct page offsets and ignores active navigation", () => {
  const { NavigationMemory } = navigation();
  assert.equal(typeof NavigationMemory, "function");
  const memory = new NavigationMemory();
  assert.equal(memory.navigate("/portfolio", "/portfolio", 720), null);
  assert.equal(memory.navigate("/portfolio", "/watchlist", 720), 0);
  assert.equal(memory.navigate("/watchlist", "/portfolio", 360), 720);
  assert.equal(memory.navigate("/portfolio", "/watchlist", 820), 360);
});
test("an error or shortened list clamps once at the deadline and can be disposed on route change", () => {
  const { restoreWhenReady } = navigation();
  assert.equal(typeof restoreWhenReady, "function");
  const v = viewport();
  restoreWhenReady(720, v.env);
  v.expire();
  assert.deepEqual(v.moves, [100]);
  const next = viewport();
  const dispose = restoreWhenReady(720, next.env);
  dispose();
  next.grow(1400);
  next.expire();
  assert.deepEqual(next.moves, []);
});

test("mobile scroll memory follows the document instead of a non-scrolling content panel", () => {
  const moves = [],
    listeners = [];
  const window = {
    scrollY: 280,
    innerHeight: 812,
    matchMedia: () => ({ matches: true }),
    addEventListener: (name) => listeners.push(name),
    removeEventListener: () => {},
    scrollTo: (value) => moves.push(value),
  };
  const document = {
    getElementById: () => ({
      scrollTop: 0,
      scrollHeight: 400,
      clientHeight: 400,
    }),
    documentElement: { scrollHeight: 1800 },
    querySelector: () => null,
  };
  const env = navigation(window, document).browserScrollEnvironment();
  assert.equal(env.readTop(), 280);
  assert.equal(env.maxScroll(), 988);
  env.scrollTo(310);
  assert.equal(moves[0].top, 310);
  env.onScroll(() => {});
  assert.deepEqual(listeners, ["scroll"]);
});
