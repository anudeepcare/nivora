import { customerText } from "../lib/customer-language.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import * as format from "../lib/format.ts";
import { latestFinancialEvidence } from "../lib/analysis.ts";
import { selectPriceReference } from "../lib/price-reference.ts";
import { movementContext } from "../lib/movement-context.ts";
import { headerMarketContext } from "../lib/business-history.ts";
import { retainResearchQuote } from "../lib/research-quote.ts";
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
    fs.readFileSync("app/studio-foundation.css", "utf8") +
      fs.readFileSync("app/globals.css", "utf8"),
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
function researchMarkup(issues = []) {
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
    issues,
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
    customerText,
    useAccess: () => ({
      access: {
        features: Object.fromEntries(
          [
            "overview",
            "business",
            "financials",
            "value",
            "technicals",
            "analysts",
            "news",
            "advanced",
            "portfolio",
            "home",
            "ai",
            "longHistory",
          ].map((k) => [k, true]),
        ),
      },
    }),
    FeatureGate: ({ children }) => children,
    FreeSnapshot: () => null,
    React,
    ...format,
    tabs: ["Snapshot", "Financials", "Valuation", "Technicals", "Thesis"],
    ranges: ["1D", "1W", "1M", "6M", "1Y", "5Y"],
    useState: (v) => [typeof v === "function" ? v() : v, empty],
    useSearchParams: () => new URLSearchParams(),
    useMemo: (f) => f(),
    useRef: (value) => ({ current: value }),
    useLayoutEffect: () => {},
    useEffect: () => {},
    useLivePrices: () => ({ ticks: {}, connected: false }),
    useResearchPreferences: () => ({ preferences: { detail: "essential" } }),
    ResearchModeSwitch: () => null,
    mergePriceTick: (base) => base,
    quoteHealth: (base) => base,
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
    retainResearchQuote,
    headerMarketContext,
    latestFinancialEvidence,
    selectPriceReference,
    movementContext,
  };
  // Render the actual shared provenance component too; details remain available
  // in its disclosure rather than cluttering the quote headline.
  const ui = ts.createSourceFile(
    "Ui.tsx",
    fs.readFileSync("components/Ui.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const stamp = ui.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "DataStamp",
  );
  const stampCode = ts.transpileModule(
    stamp.getText(ui).replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  bindings.DataStamp = new Function(
    "React",
    "dateLabel",
    "quoteTime",
    "Help",
    "customerText",
    stampCode + ";return DataStamp;",
  )(
    React,
    format.dateLabel,
    format.quoteTime,
    ({ children }) => React.createElement("dialog", {}, children),
    customerText,
  );
  for (const name of [
    "StockFacts",
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
    "DecisionBrief",
    "DecisionWorkspace",
    "DecisionOverview",
    "DecisionWatch",
    "PositionAwareResearch",
    "ValuationLab",
    "TimingContext",
    "FinancingContext",
    "EarningsPrep",
    "ResearchNotes",
    "ResearchCompare",
    "CompanyBrief",
    "ResearchOutlook",
    "OverviewContext",
    "CompanyUpdates",
    "AnalystRatings",
    "KeyFinancialMetrics",
    "CaseHighlights",
    "EarningsWorkspace",
    "ResearchChanges",
    "ResearchCoverage",
    "CompanyMetrics",
    "DcaResearch",
    "Bookmark",
    "RefreshCw",
    "X",
    "ArrowUpRight",
  ])
    bindings[name] = empty;
  bindings.Help = ({ children }) => React.createElement("div", null, children);
  bindings.DecisionOverview = () =>
    React.createElement("section", { "data-overview-evidence": "edge" });
  bindings.KeyFinancialMetrics = () =>
    React.createElement("section", { "data-overview-evidence": "financials" });
  bindings.DecisionWorkspace = () =>
    React.createElement("section", { "data-overview-evidence": "lenses" });
  bindings.DecisionWatch = () =>
    React.createElement("section", { "data-overview-evidence": "thresholds" });
  const component = new Function(
    ...Object.keys(bindings),
    code + ";return Research;",
  )(...Object.values(bindings));
  return renderToStaticMarkup(component({ symbol: "SAP" }));
}
test("the actual Snapshot discloses backup data without vendor names", () => {
  assert.match(researchMarkup(), /Backup data used/);
  assert.doesNotMatch(researchMarkup(), /EODHD|Twelve Data/);
});
test("unverified upcoming EPS is never formatted in the listing currency", () => {
  const html = researchMarkup();
  assert.doesNotMatch(html, /\$3\.21/);
  assert.doesNotMatch(
    html,
    /3\.21/,
    "The approved Overview does not repeat the earnings panel",
  );
  assert.doesNotMatch(html, /Estimated EPS/);
});

test("Simple overview delegates to Edge without repeating the full evidence panels", () => {
  const html = researchMarkup();
  assert.match(html, /data-overview-evidence="edge"/);
  for (const section of ["financials", "lenses", "thresholds"])
    assert.ok(!html.includes(`data-overview-evidence="${section}"`));
});

test("coverage details preserve the failure without exposing vendor names", () => {
  const html = researchMarkup([
    "EODHD did not authorize this dataset",
    "Twelve Data financial data is temporarily unavailable",
  ]);
  assert.doesNotMatch(html, /EODHD|Twelve Data/i);
  assert.match(html, /did not authorize this dataset/);
});
