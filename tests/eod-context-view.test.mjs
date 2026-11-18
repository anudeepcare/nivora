import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const source = fs.readFileSync("components/EconomicContext.tsx", "utf8");
function view(kind, preview = false, data = null) {
  let requested;
  const exports = {};
  const react = { ...React, useState: () => [kind, () => {}] };
  const js = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "exports", "React", js)(
    (name) =>
      name === "react"
        ? react
        : name === "./Session"
          ? {
              useResource: (key) => {
                requested = key;
                return { data, loading: false, refresh: () => {} };
              },
            }
          : name === "./Ui"
            ? { Help: () => null }
            : { default: new Proxy({}, { get: (_, k) => k }) },
    exports,
    React,
  );
  return {
    html: renderToStaticMarkup(
      React.createElement(exports.default, { symbol: "TEST", preview }),
    ),
    requested,
  };
}
test("context starts without requests, only selected dataset loads and preview never fetches", () => {
  assert.equal(view(null).requested, null);
  assert.equal(view("economy", true).requested, null);
  assert.equal(
    view("dividends").requested,
    "market-context?kind=dividends&symbol=TEST",
  );
  assert.equal(view("treasury").requested, "market-context?kind=treasury");
});
test("actual Treasury observation and units shown without injecting them into company valuation", () => {
  const rendered = view("treasury", false, {
    kind: "treasury",
    date: "2026-11-17",
    rows: [{ tenor: "2Y", rate: 3.2 }],
    spread10y2y: null,
    checkedAt: "2026-11-18T00:00:00Z",
    cacheMaxAgeSeconds: 21600,
  });
  assert.match(rendered.html, /observation 2026-11-17/);
  assert.match(rendered.html, /3.2%/);
  assert.match(rendered.html, /Checked/);
  assert.match(rendered.html, /up to.*6.*hours old/);
  assert.doesNotMatch(rendered.html, /Retrieved/);
  assert.doesNotMatch(rendered.html, /discount rate/);
});
