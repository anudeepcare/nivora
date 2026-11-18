import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function render(headline, rows = []) {
  const out = { exports: {} };
  const js = ts.transpileModule(
    fs.readFileSync("components/MarketSessionDashboard.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", "React", js)(
    () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }),
    out,
    out.exports,
    React,
  );
  return renderToStaticMarkup(
    React.createElement(out.exports.default, {
      data: { headline, rows, asOf: "2026-11-17", id: "market-session" },
    }),
  );
}
const m = (label, value, unit = "companies") => ({
  label,
  value,
  unit,
  asOf: "2026-11-17",
  flags: [],
  note: null,
  period: null,
  sourceUrl: null,
});
test("breadth uses actual complete counts and ETF signed comparisons, not invented history", () => {
  const html = render(
    [
      m("Companies higher", 75),
      m("Companies lower", 422),
      m("Companies unchanged", 1),
      m("Companies counted", 498),
    ],
    [
      {
        id: "SPY",
        name: "Fund",
        category: "S&P 500",
        metrics: [m("Change", -1.01, "percent"), m("Price", 732.44, "usd")],
      },
    ],
  );
  assert.match(html, /15\.1%/);
  assert.match(html, /422/);
  assert.match(html, /data-direction="down"/);
  assert.match(html, /−1\.01%/);
  assert.match(html, /2026-11-17/);
  assert.match(html, /Exact readings/);
});
test("missing or inconsistent counts never create normalized breadth", () => {
  for (const headline of [
    [m("Companies higher", 75)],
    [
      m("Companies higher", 75),
      m("Companies lower", 422),
      m("Companies unchanged", 1),
      m("Companies counted", 500),
    ],
  ]) {
    const html = render(headline);
    assert.doesNotMatch(html, /aria-label="Company price breadth proportions"/);
    assert.match(html, /Not enough consistent counts/);
  }
});
