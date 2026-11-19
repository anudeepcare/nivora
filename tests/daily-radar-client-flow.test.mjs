import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
function client(responses) {
  let state, effect, cleanup;
  let hooks = 0;
  const calls = [],
    timers = [];
  const cache = new Map();
  const js = ts.transpileModule(
    fs.readFileSync("components/DailyMarketRadar.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  new Function("require", "exports", "React", "setTimeout", "clearTimeout", js)(
    (name) =>
      name === "react"
        ? {
            ...React,
            useState: (initial) => {
              const n = hooks++;
              if (n === 0) state = initial;
              return [
                n === 0 ? state : initial,
                (update) => {
                  if (n === 0)
                    state =
                      typeof update === "function" ? update(state) : update;
                },
              ];
            },
            useEffect: (fn) => (effect = fn),
          }
        : name === "./Session"
          ? { useProduct: () => ({ cache }) }
          : name === "../lib/client"
            ? {
                api: async (path, body, signal) => {
                  calls.push({ path, body, signal });
                  const result = responses.shift();
                  if (result instanceof Error) throw result;
                  if (!result) throw Error("Unexpected request");
                  return result;
                },
              }
            : name.endsWith(".css")
              ? { default: {} }
              : {},
    exports,
    React,
    (fn, delay) => {
      timers.push({ fn, delay });
      return timers.length;
    },
    () => {
      timers.length = 0;
    },
  );
  exports.default({ research: [], requested: ["A"], asOf: "2026-11-18" });
  cleanup = effect();
  const settle = () => new Promise((r) => setImmediate(r));
  return {
    calls,
    timers,
    get state() {
      return state;
    },
    settle,
    cleanup,
    async next() {
      assert.ok(timers.length);
      timers.shift().fn();
      await settle();
    },
  };
}
const snapshot = (rows, patch = {}) => ({
  day: "2026-11-18",
  requested: 500,
  eligible: 500,
  excluded: 0,
  ready: 500,
  pending: 0,
  rows,
  retryAfterSeconds: 0,
  ...patch,
});
const rows = (start, n) =>
  Array.from({ length: n }, (_, i) => ({
    symbol: `T${start + i}`,
    status: "ready",
    history: [],
  }));
test("actual client hydrates500warm cached rows using returned50row cursors without advancing provider", async () => {
  const c = client(
    Array.from({ length: 10 }, (_, i) =>
      snapshot(rows(i * 50, 50), {
        incremental: i > 0,
        nextCursor: i < 9 ? (i + 1) * 50 : null,
      }),
    ),
  );
  await c.settle();
  for (let i = 1; i < 10; i++) {
    assert.equal(c.timers[0].delay, 2100);
    await c.next();
  }
  assert.equal(c.state.snapshot.rows.length, 500);
  assert.equal(c.calls.length, 10);
  assert.ok(c.calls.every((x) => !x.body));
  c.cleanup();
  assert.equal(c.timers.length, 0);
  assert.ok(c.calls.every((x) => x.signal.aborted));
});
test("actual client merges cold incrementalprogress and retains prior evidence on failure for explicit retry", async () => {
  const c = client([
    snapshot([], { ready: 0, pending: 500, retryAfterSeconds: 3 }),
    snapshot(rows(0, 2), {
      ready: 2,
      pending: 498,
      retryAfterSeconds: 3,
      incremental: true,
    }),
    Error("Provider temporarily unavailable"),
  ]);
  await c.settle();
  assert.equal(c.timers[0].delay, 3000);
  await c.next();
  assert.deepEqual(c.calls[1].body, { continue: true });
  assert.equal(c.state.snapshot.rows.length, 2);
  await c.next();
  assert.equal(c.state.snapshot.rows.length, 2);
  assert.match(c.state.error, /temporarily unavailable/);
  assert.equal(c.timers.length, 0);
  c.cleanup();
});
test("finaladvance triggers readback and changes UTCday replace rather than merge snapshots", async () => {
  const c = client([
    snapshot(rows(0, 2), { ready: 2, pending: 1, retryAfterSeconds: 3 }),
    snapshot(rows(2, 1), { ready: 3, pending: 0, incremental: true }),
    snapshot(rows(3, 1), { day: "2026-11-19", ready: 1, pending: 0 }),
  ]);
  await c.settle();
  await c.next();
  assert.equal(c.state.snapshot.rows.length, 3);
  assert.equal(c.timers[0].delay, 2100);
  await c.next();
  assert.equal(c.state.snapshot.rows.length, 1);
  assert.equal(c.state.snapshot.day, "2026-11-19");
  assert.equal(c.calls[2].body, undefined);
  c.cleanup();
});
