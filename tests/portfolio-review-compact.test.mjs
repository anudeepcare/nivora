import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { sourceModule } from "./helpers/provider-fixture.mjs";
const mod = { exports: {} };
const code = ts.transpileModule(
  fs.readFileSync("components/DecisionAttention.tsx", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
new Function("require", "module", "exports", code)(
  (name) => {
    if (name.endsWith(".css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, key) => String(key) }),
      };
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (name.startsWith("@/")) return sourceModule(name.slice(2) + ".ts");
    throw Error(name);
  },
  mod,
  mod.exports,
);
const symbols = ["AAA", "BBB", "CCC", "DDD"];
const props = {
  symbols,
  held: symbols,
  prefix: "/app",
  rows: Object.fromEntries(
    symbols.map((symbol) => [
      symbol,
      {
        signal: {
          action: "Review",
          reason: `${symbol} full business explanation`,
          risk: "Funding risk",
          changeCondition: "Next filing",
          evidenceAsOf: "2026-11-13",
          businessPeriod: "2026-09-30",
          view: { detail: "Assessment", actionLabel: "Review business" },
        },
      },
    ]),
  ),
  allocations: [{ symbol: "AAA", weight: 45 }],
  concentrationLimit: 30,
};
const render = (extra) =>
  renderToStaticMarkup(
    React.createElement(mod.exports.default, { ...props, ...extra }),
  );
test("Portfolio review uses individual disclosure rows, not a second grid of repeated cards", () => {
  const html = render({ compact: true });
  assert.match(html, /class="root compact"/);
  assert.equal((html.match(/class="reviewDetails"/g) || []).length, 4);
  assert.doesNotMatch(html, /Review all|What to check next/);
  for (const symbol of symbols)
    assert.equal(
      (html.match(new RegExp(`href="[^"]*${symbol}[^\"]*"`, "g")) || []).length,
      1,
    );
  assert.doesNotMatch(html, /<details[^>]* open/);
});
test("compact disclosures preserve the full evidence, position constraint and reference dates", () => {
  const html = render({ compact: true });
  for (const symbol of symbols)
    assert.match(html, new RegExp(`${symbol} full business explanation`));
  for (const value of [
    "Funding risk",
    "Next filing",
    "45.0%",
    "15.0 percentage points above",
    "Business assessment",
    "Price reference",
    "Financial period",
  ])
    assert.ok(html.includes(value), value);
});
test("default review keeps its existing progressive card view", () => {
  const html = render({});
  assert.match(html, /Review all 4 companies/);
  assert.match(html, /What to check next/);
  assert.doesNotMatch(html, /class="reviewDetails"/);
});
