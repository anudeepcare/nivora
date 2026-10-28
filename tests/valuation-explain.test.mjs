import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import ts from "typescript";

function component(file) {
  const source = fs.readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("React", "exports", "module", js)(React, module.exports, module);
  return module.exports.default;
}
const ValuationExplain = component("ValuationExplain.tsx");
const PortfolioRisk = component("PortfolioRisk.tsx");

const output = (overrides = {}) => ({
  status: "ok", symbol: "MSFT", asOf: "2026-10-28", family: "profitable-growth", modelVersion: "valuation@1.0.0", traceId: "valuation-test", confidence: 78, dataQuality: 96,
  cases: { bear: { value: 80, vsPrice: -0.2, g0: 0.1, margin: 0.2, rate: 0.09, gT: 0.03 }, base: { value: 100, vsPrice: 0, g0: 0.15, margin: 0.2, rate: 0.09, gT: 0.03 }, bull: { value: 125, vsPrice: 0.25, g0: 0.2, margin: 0.22, rate: 0.085, gT: 0.03 } },
  methods: [{ id: "multi-stage-dcf", confidence: 78, value: 100, weight: 1 }], flags: [], refusalReason: null,
  ...overrides,
});

test("glass-box explain card keeps primary language simple and exposes audit fields on demand", () => {
  const html = renderToStaticMarkup(React.createElement(ValuationExplain, { output: output(), sources: [{ metric: "revenue", tag: "us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax", source: "SEC", sourceRef: "abc", transformation: "TTM sum of four comparable quarters", asOf: "2026-09-30" }] }));
  assert.match(html, /Base case/);
  assert.match(html, /Model assumptions/);
  assert.match(html, /Glass-box audit/);
  assert.match(html, /TTM sum of four comparable quarters/);
  assert.doesNotMatch(html, /api\.example|vendor-endpoint/);
});

test("refused and disputed outputs explain limits without showing a fake target", () => {
  const html = renderToStaticMarkup(React.createElement(ValuationExplain, { output: output({ status: "refused", cases: { bear: { value: null }, base: { value: null }, bull: { value: null } }, flags: ["disputed input"], refusalReason: "A reconciled share count is unavailable." }), sources: [] }));
  assert.match(html, /Valuation not established/);
  assert.match(html, /reconciled share count is unavailable/);
  assert.match(html, /disputed input/);
  assert.doesNotMatch(html, /\$0/);
});

test("portfolio risk card labels partial coverage and tail metrics", () => {
  const html = renderToStaticMarkup(React.createElement(PortfolioRisk, { risk: { coverage: 0.5, concentration: 0.42, var_95: 0.12, expected_shortfall_95: 0.18, scenario_contribution: { bear: -0.1, base: 0.02, bull: 0.12 }, flags: ["partial-coverage"] } }));
  assert.match(html, /Expected shortfall/);
  assert.match(html, /Partial coverage/);
  assert.match(html, /Bear case/);
});
