import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
const source = fs.readFileSync("components/HomeRadar.tsx", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
let effects = [],
  ready = false,
  calculations = 0;
const fakeReact = {
  ...React,
  useState: () => [
    ready,
    (v) => {
      ready = v;
    },
  ],
  useEffect: (fn) => effects.push(fn),
  memo: (fn, compare) => ({ fn, compare }),
};
const exports = {};
new Function("require", "exports", "React", js)(
  (name) =>
    name === "react"
      ? fakeReact
      : name.includes("MarketRadar")
        ? {
            MarketRadar: () => {
              calculations++;
              return null;
            },
          }
        : {
            default: () => {
              calculations++;
              return null;
            },
          },
  exports,
  React,
);
const props = {
  research: [{ company: { symbol: "TEST" } }],
  requested: ["TEST"],
  asOf: "2026-11-17",
  prefix: "",
  demo: false,
};
test("radar skips quote-only rerenders but invalidates changed evidence, universe, account route and day", () => {
  const compare = exports.default.compare;
  assert.equal(
    compare(props, {
      ...props,
      research: [...props.research],
      requested: [...props.requested],
    }),
    true,
  );
  for (const changed of [
    { research: [{ ...props.research[0] }] },
    { requested: ["OTHER"] },
    { asOf: "2026-11-18" },
    { prefix: "/preview" },
    { demo: true },
  ])
    assert.equal(compare(props, { ...props, ...changed }), false);
});
test("radar first render yields instead of running either analysis; mount is cancellable and adds no requests", () => {
  const before = exports.default.fn(props);
  assert.equal(before.props.role, "status");
  assert.equal(calculations, 0);
  let pending, cancelled;
  globalThis.window = {
    requestIdleCallback: (fn, options) => {
      pending = fn;
      assert.equal(options.timeout, 500);
      return 7;
    },
    cancelIdleCallback: (id) => {
      cancelled = id;
    },
  };
  const cleanup = effects[0]();
  assert.equal(ready, false);
  pending();
  assert.equal(ready, true);
  cleanup();
  assert.equal(cancelled, 7);
  delete globalThis.window;
  assert.match(source, /clearTimeout/);
  assert.doesNotMatch(
    source,
    /fetch\(|useResource|localStorage|sessionStorage/,
  );
  ready = true;
  const after = exports.default.fn(props);
  assert.equal(React.Children.count(after.props.children), 1);
  const daily = React.Children.toArray(after.props.children)[0];
  assert.ok(
    daily.props.sampleEvidence,
    "business evidence stays available inside the single radar disclosure",
  );
});
