import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import * as format from "../lib/format.ts";
import { normalizeBars } from "../lib/market.ts";
import { normalizeEodBars } from "../lib/eodhd-normalize.ts";
const asOf = "2026-10-17T12:00:00Z";
test("both providers reject same-day future intraday candles at the timestamp boundary", () => {
  const rows = ["11:55:00", "12:00:00", "20:00:00"].map((time) => ({
    datetime: "2026-10-17 " + time,
    open: 10,
    high: 12,
    low: 9,
    close: 11,
    volume: 20,
  }));
  assert.equal(normalizeEodBars(rows, true, [], asOf).length, 2);
  assert.equal(normalizeBars(rows, true, Date.parse(asOf)).length, 2);
});
test("financial selected-control styles outrank global button resets", () => {
  const base = postcss.parse(
    fs.readFileSync("app/approved-design.css", "utf8"),
  );
  const module = postcss.parse(
    fs.readFileSync("components/ResearchWorkspace.module.css", "utf8"),
  );
  function specificity(s) {
    s = s.replace(/:where\([^)]*\)/g, "");
    return (
      (s.match(/#[\w-]+/g) || []).length * 100 +
      (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length * 10 +
      (s.match(/(^|\s)(button|input|select)\b/g) || []).length
    );
  }
  for (const cls of ["controls", "filters"]) {
    let selected;
    module.walkRules((r) => {
      if (r.selector === `.${cls} button[aria-pressed="true"]`) selected = r;
    });
    assert.ok(selected);
    base.walkRules((r) => {
      for (const selector of r.selector.split(",")) {
        if (
          !/^(?:#auryn-app|:where\(#auryn-app\)) button(?::hover|:active)?$/.test(
            selector.trim(),
          )
        )
          continue;
        if (r.nodes.some((n) => ["background", "color"].includes(n.prop)))
          assert.ok(
            specificity(selected.selector) > specificity(selector),
            `Selected ${cls} must outrank ${selector}`,
          );
      }
    });
  }
});
function researchMarkup() {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  const ast = ts.createSourceFile(
    "Research.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Research",
  );
  const code = ts.transpileModule(
    declaration.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const r = {
    company: {
      symbol: "SAP",
      name: "SAP SE",
      assetType: "stock",
      exchange: "NYSE",
      currency: "USD",
      foreignListing: true,
    },
    quote: {
      price: 200,
      currency: "USD",
      source: "EODHD · delayed / indicative · fallback",
      asOf: "2026-10-17T11:00:00Z",
      session: "Delayed quote",
      changePct: 1,
      stale: false,
    },
    issues: [],
    history: [],
    facts: [],
    filings: [],
    retrievedAt: asOf,
    evidence: {
      earnings: [{ date: "2099-02-01", estimate: 3.21, actual: null }],
    },
  };
  const empty = () => null;
  const bindings = {
    React,
    ...format,
    tabs: ["Snapshot", "Financials", "Valuation", "Technicals", "Thesis"],
    ranges: ["1D", "1W", "1M", "6M", "1Y", "5Y"],
    useState: (v) => [v, empty],
    useMemo: (f) => f(),
    useProduct: () => ({ workspace: { watchlist: [] }, mutate: empty }),
    useResource: (path) => ({
      data: path?.startsWith("research/") ? r : undefined,
    }),
    perspective: () => ({
      heading: "Review the business",
      business: "Developing",
      valuation: "Review",
      growth: null,
      last: null,
      tech: { trend: "Weak" },
    }),
    rangeBars: () => [],
  };
  for (const name of [
    "SecurityLogo",
    "Help",
    "Notice",
    "Empty",
    "PriceChart",
    "Financials",
    "InvestmentCase",
    "EarningsScenario",
    "Valuation",
    "TechnicalLevels",
    "ProviderMetrics",
    "Forecasts",
    "ResearchThesis",
    "DcaCard",
    "Bookmark",
    "RefreshCw",
    "ArrowUpRight",
  ])
    bindings[name] = empty;
  const component = new Function(
    ...Object.keys(bindings),
    code + ";return Research;",
  )(...Object.values(bindings));
  return renderToStaticMarkup(component({ symbol: "SAP" }));
}
test("the actual Snapshot renders quote fallback provenance", () => {
  assert.match(researchMarkup(), /EODHD.*fallback/);
});
test("unverified upcoming EPS is never formatted in the listing currency", () => {
  const html = researchMarkup();
  assert.doesNotMatch(html, /\$3\.21/);
  assert.match(html, /3\.21/);
  assert.match(html, /currency.*unverified/i);
});
