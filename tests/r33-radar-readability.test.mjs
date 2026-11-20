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
test("radar presents explicit truthful state and compact numeric progress", () => {
  assert.match(render().html, /data-state="loading"/);
  assert.match(
    render({ error: "Daily radar requires its database migration." }).html,
    /data-state="setup"/,
  );
  assert.match(
    render({ error: "Unexpected gateway response" }).html,
    /data-state="unavailable"/,
  );
  const snapshot = {
    day: "2026-11-20",
    ready: 1,
    eligible: 2,
    pending: 1,
    excluded: 0,
    rows: [{ symbol: "TEST", status: "ready", history: [] }],
  };
  const html = render({ snapshot }).html;
  assert.match(html, /data-state="loading"/);
  assert.match(html, /<dl/);
  assert.match(
    render({ snapshot: { ...snapshot, pending: 0 } }).html,
    /data-state="ready"/,
  );
});
test("technical error is disclosed, not the primary user explanation", () => {
  const html = render({ error: "Unexpected gateway response" }).html;
  assert.match(html, /<summary>Technical detail<\/summary>/);
  assert.match(html, /Your saved holdings/);
});
test("one combined sample disclosure replaces the duplicate lower wrapper", () => {
  const home = fs.readFileSync("components/HomeRadar.tsx", "utf8");
  const daily = fs.readFileSync("components/DailyMarketRadar.tsx", "utf8");
  assert.match(home, /sampleEvidence=/);
  assert.match(daily, /\{sampleEvidence\}/);
  assert.doesNotMatch(home, /props\.research\.length > 0 &&/);
});

test("completed zero-coverage and source outage never claim ready", () => {
  const snapshot = {
    day: "2026-11-20",
    ready: 0,
    eligible: 2,
    pending: 0,
    excluded: 0,
    rows: [],
  };
  assert.match(render({ snapshot }).html, /data-state="unavailable"/);
  assert.match(render({ snapshot }).html, /No daily histories are available/);
  assert.match(
    render({
      snapshot: {
        ...snapshot,
        pending: 2,
        mode: "bulk-opt-in",
        sourceStatus: "unavailable",
      },
    }).html,
    /data-state="unavailable"/,
  );
});
