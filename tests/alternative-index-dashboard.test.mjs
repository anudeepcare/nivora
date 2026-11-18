import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
function render(value, scale = "SENTIMENT", history = false) {
  const detail = {
    id: "ai-sentiment",
    name: "AI sentiment",
    scale,
    value,
    asOf: "2026-11-18",
    coverage: 1,
    basketSize: 2,
    totalMentions: 4,
    methodology: "Reported method",
    constituents: [
      {
        name: "Example",
        role: "Product",
        state: "CARRIED_FORWARD",
        value,
        weight: 1,
        mentions: 4,
      },
    ],
  };
  const m = { exports: {} };
  const js = ts.transpileModule(
    fs.readFileSync("components/AlternativeIndexes.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", js)(
    (n) =>
      n === "react"
        ? {
            ...React,
            useState: (v) => [
              v === null
                ? "ai-sentiment"
                : history && v === "detail"
                  ? "history"
                  : v,
              () => {},
            ],
          }
        : n === "react/jsx-runtime"
          ? jsx
          : n === "./Session"
            ? {
                useResource: (key) => ({
                  data: {
                    data:
                      key === "alternative-indexes"
                        ? []
                        : history
                          ? {
                              id: "ai-sentiment",
                              name: "AI sentiment",
                              scale,
                              days: 180,
                              points: [
                                { date: "2026-10-01", value: -0.2 },
                                { date: "2026-11-18", value: 0.3 },
                              ],
                            }
                          : detail,
                    retrievedAt: "2026-11-18T12:00:00Z",
                  },
                }),
              }
            : n.endsWith(".css")
              ? new Proxy({}, { get: (_, k) => String(k) })
              : (() => {
                  throw Error(n);
                })(),
    m,
    m.exports,
  );
  return renderToStaticMarkup(React.createElement(m.exports.default));
}
test("signed gauge and constituent plot retain numeric scale and stale-state text", () => {
  const html = render(-0.4);
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuemin="-1"/);
  assert.match(html, /aria-valuenow="-0.4"/);
  assert.match(html, /Constituent readings/);
  assert.match(html, /CARRIED FORWARD/);
  assert.match(html, /Negative tone/);
  assert.match(html, /not expected returns/);
});
test("composite does not reuse signed axis and missing observation gets no gauge marker", () => {
  const html = render(60, "PERCENT_0_100");
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="100"/);
  assert.doesNotMatch(html, /Negative tone/);
  assert.doesNotMatch(render(null), /role="meter"/);
  assert.match(render(null), /Not supplied/);
});

test("history visibly labels actual date endpoints and signed zero reference", () => {
  const html = render(0, "SENTIMENT", true);
  assert.match(html, />2026-10-01<\/text>/);
  assert.match(html, />2026-11-18<\/text>/);
  assert.match(html, /0 · Neutral/);
  assert.match(html, /stroke-dasharray="4 4"/);
});
