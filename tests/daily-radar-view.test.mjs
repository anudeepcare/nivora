import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function render({ error = "", snapshot = null, sampleOpen = false } = {}) {
  const cache = new Map();
  let hook = 0,
    charts = 0;
  const react = {
    ...React,
    useEffect: () => {},
    useState: (initial) => {
      hook++;
      return [
        hook === 1
          ? { key: "OTHER,TEST", cache, snapshot, error }
          : hook === 3
            ? sampleOpen
            : 0,
        () => {},
      ];
    },
  };
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
  new Function("require", "exports", "React", js)(
    (name) =>
      name === "react"
        ? react
        : name === "./Session"
          ? { useProduct: () => ({ cache }) }
          : name === "./MarketRadar"
            ? {
                MarketRadar: () => {
                  charts++;
                  return React.createElement("div", { "data-chart": true });
                },
              }
            : name.includes("provider-symbol")
              ? { providerSymbol: (s) => s, providerIdentity: (s) => s }
              : name.endsWith(".css")
                ? { default: new Proxy({}, { get: (_, k) => k }) }
                : {},
    exports,
    React,
  );
  const html = renderToStaticMarkup(
    React.createElement(exports.default, {
      research: [{ company: { symbol: "TEST" } }],
      requested: ["TEST", "OTHER"],
      asOf: "2026-11-18",
    }),
  );
  return { html, charts };
}
test("missing migration is a compact exclusive error, never still checking or auto-rendering a one-stock radar", () => {
  const { html, charts } = render({
    error: "Daily radar requires its database migration.",
  });
  assert.match(html, /Daily radar setup required/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Checking today|role="status"/);
  assert.equal(charts, 0);
  assert.match(html, /1 of 2/);
});
test("loading, completed partial evidence, and paused progress have truthful distinct states", () => {
  assert.match(render().html, /Checking today/);
  const snapshot = {
    day: "2026-11-18",
    eligible: 2,
    ready: 1,
    pending: 1,
    excluded: 0,
    rows: [{ symbol: "TEST", status: "ready", history: [] }],
  };
  const loaded = render({ snapshot });
  assert.match(loaded.html, /1 histories shown/);
  assert.equal(loaded.charts, 1);
  const paused = render({ snapshot, error: "Provider paused" });
  assert.match(paused.html, /Refresh paused/);
  assert.doesNotMatch(paused.html, /Checking today/);
  assert.equal(paused.charts, 1);
});
