import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { demoData } from "./fixtures/demo.ts";
import { approvedResearch } from "../lib/approved-research.ts";
import { sameProviderSymbol } from "../lib/provider-symbol.ts";
function setup() {
  const source = fs.readFileSync("components/IntegratedResearch.tsx", "utf8");
  const ast = ts.createSourceFile(
    "x.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "IntegratedResearch",
  );
  const code = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  let cursor = 0;
  const states = [];
  const marker = (name) => () => React.createElement("p", null, name);
  const scope = {
    React,
    useState: (value) => {
      const i = cursor++;
      if (!(i in states))
        states[i] = typeof value === "function" ? value() : value;
      return [
        states[i],
        (v) => {
          states[i] = v;
        },
      ];
    },
    useEffect: () => {},
    useMemo: (f) => f(),
    useProduct: () => ({ workspace: demoData.workspace, demo: demoData }),
    approvedResearch,
    sameProviderSymbol,
    s: {},
    consensusOutlook: () => null,
    OverviewBrief: marker("brief"),
    PaceInstrument: marker("pace"),
    ResearchChanges: marker("changes"),
    EvidenceCrystal: marker("crystal"),
    SelectedValuation: marker("valuation"),
    AnalystTargets: marker("targets"),
    DataFreshness: marker("freshness"),
    ResearchEvidenceGrid: marker("all evidence"),
    CompanyMetrics: marker("contextual company metrics"),
    PositionExplorer: marker("funding and concentration review"),
  };
  const View = new Function(
    ...Object.keys(scope),
    code + ";return IntegratedResearch;",
  )(...Object.values(scope));
  const render = () => {
    cursor = 0;
    return View({ research: demoData.research.MSFT, onTab: () => {} });
  };
  return { render };
}
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props?.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
test("active Research overview exposes contextual company metrics by default", () => {
  assert.match(
    fs.readFileSync("components/Research.tsx", "utf8"),
    /import DecisionOverview from "\.\/IntegratedResearch"/,
  );
  const { render } = setup();
  assert.match(renderToStaticMarkup(render()), /contextual company metrics/);
});
test("active overview omits the removed position size and cash tool", () => {
  const { render } = setup();
  const html = renderToStaticMarkup(render());
  assert.doesNotMatch(
    html,
    /Review position size|funding and concentration review/,
  );
  assert.match(html, /contextual company metrics/);
  assert.match(html, /all evidence/);
  assert.doesNotMatch(html, /All research metrics/);
});

test("company metrics show every selected available metric without an expand button", async () => {
  const source = fs.readFileSync("components/CompanyMetrics.tsx", "utf8");
  const ast = ts.createSourceFile(
    "x.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "CompanyMetrics",
  );
  const code = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const { overviewEvidence, companyMetricSelection } = await import(
    "../lib/overview-evidence.ts"
  );
  const { headerMarketContext } = await import("../lib/business-history.ts");
  const format = await import("../lib/format.ts");
  const r = structuredClone(demoData.research.MSFT);
  r.facts = [2024, 2025].flatMap((year) =>
    Object.entries({
      revenue: year === 2025 ? 120 : 100,
      operatingIncome: 30,
      operatingCashFlow: 36,
      capex: -12,
      weightedShares: 12,
      cash: 30,
      debt: 50,
    }).map(([metric, value]) => ({
      id: `${year}:${metric}`,
      metric,
      value,
      unit: metric === "weightedShares" ? "shares" : "USD",
      currency: metric === "weightedShares" ? null : "USD",
      start: ["cash", "debt"].includes(metric) ? null : `${year}-01-01`,
      end: `${year}-12-31`,
      filed: `${year + 1}-02-01`,
      accession: `annual-${year}`,
      form: "10-K",
      sourceUrl: `https://example.com/report-${year}`,
      basis: "GAAP",
      scope: ["cash", "debt"].includes(metric) ? "instant" : "annual",
    })),
  );
  const evidence = overviewEvidence(r, { includeTechnical: false });
  const market = headerMarketContext(r);
  const selected = companyMetricSelection(
    evidence,
    market.marketCap == null ? 8 : 7,
  );
  assert.ok(
    selected.length > 4,
    "fixture must exercise metrics beyond the previous collapsed four",
  );
  const scope = {
    React,
    useMemo: (f) => f(),
    useState: () => [false, () => {}],
    overviewEvidence,
    companyMetricSelection,
    headerMarketContext,
    ...format,
    styles: {},
    Help: () => null,
    Source: () => null,
  };
  const View = new Function(
    ...Object.keys(scope),
    code + ";return CompanyMetrics;",
  )(...Object.values(scope));
  const html = renderToStaticMarkup(React.createElement(View, { research: r }));
  assert.doesNotMatch(
    html,
    /More company metrics|Fewer metrics|aria-expanded|<button/,
  );
  for (const row of selected)
    assert.ok(
      html.includes(row.label),
      row.label + " should be visible by default",
    );
});
