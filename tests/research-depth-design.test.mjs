import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { demoData } from "./fixtures/demo.ts";
import * as format from "../lib/format.ts";
import { technicalContext } from "../lib/technical-context.ts";
import { advancedStudies } from "../lib/advanced-research.ts";
import { professionalStudies } from "../lib/professional-studies.ts";
import { moreStudies } from "../lib/technical-more.ts";
import { expandedStudies } from "../lib/technical-expanded.ts";
import { priceStudies } from "../lib/price-studies.ts";
import { perspective } from "../lib/analysis.ts";
function component(file, name, bindings) {
  const ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    decl = ast.statements.find(
      (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
    );
  const js = ts.transpileModule(
    decl.getText(ast).replace("export default ", "").replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), js + ";return " + name)(
    ...Object.values(bindings),
  );
}
test("technical relative volume shows the calculated observation with its own formula", () => {
  const bindings = {
    React,
    useMemo: React.useMemo,
    useRef: React.useRef,
    technicalContext,
    advancedStudies,
    professionalStudies,
    moreStudies,
    expandedStudies,
    priceStudies,
    perspective,
    ...format,
    TechnicalLevels: () => null,
    X: () => null,
  };
  const C = component(
    "components/TechnicalDashboard.tsx",
    "TechnicalDashboard",
    bindings,
  );
  const html = renderToStaticMarkup(
    React.createElement(C, { research: demoData.research.MSFT }),
  );
  assert.match(
    html,
    /Latest completed volume \/ preceding 20-observation mean/,
  );
  assert.doesNotMatch(html, /<dd>Relative volume<\/dd>/);
});
const financialBindings = {
  React,
  useMemo: React.useMemo,
  useState: React.useState,
  ...format,
  FinancialExplorer: () => null,
  FinancialDetailTable: () => null,
  Help: ({ trigger }) => React.createElement("button", null, trigger),
  DataStamp: () => null,
  Empty: () => null,
};
test("financial cash bridge uses reported cash and negative capex as a spending deduction once", () => {
  const period = {
    end: "2025-12-31",
    currency: "USD",
    revenue: 1e9,
    operatingCashFlow: 5e8,
    capex: -1e8,
    fcf: 4e8,
  };
  const C = component("components/FinancialPicture.tsx", "FinancialPicture", {
    ...financialBindings,
    researchPeriods: () => [period],
  });
  const html = renderToStaticMarkup(
    React.createElement(C, { research: demoData.research.MSFT }),
  );
  assert.match(
    html,
    /Operating cash flow less capital spending equals cash after capex/,
  );
  assert.ok(
    html.includes("Capital spending: " + format.amount(-1e8, "USD", true)),
  );
  assert.ok(
    html.includes("Cash after capex: " + format.amount(4e8, "USD", true)),
  );
  assert.match(
    html,
    /Current assets|The business generated cash after reported capital spending/,
  );
});
test("financial cash bridge does not draw unreconciled line items as a valid waterfall", () => {
  const period = {
    end: "2025-12-31",
    currency: "USD",
    revenue: 1e9,
    operatingCashFlow: 5e8,
    capex: -1e8,
    fcf: 8e8,
  };
  const C = component("components/FinancialPicture.tsx", "FinancialPicture", {
    ...financialBindings,
    researchPeriods: () => [period],
  });
  const html = renderToStaticMarkup(
    React.createElement(C, { research: demoData.research.MSFT }),
  );
  assert.doesNotMatch(
    html,
    /aria-label="Operating cash flow less capital spending equals cash after capex"/,
  );
  assert.match(html, /aria-label="Income statement snapshot"/);
  assert.match(html, /<dt>Revenue<\/dt>/);
});
test("a reconciled cash-burning business uses risk color for negative cash after capex", () => {
  const period = {
    end: "2025-12-31",
    currency: "USD",
    revenue: 1e9,
    operatingCashFlow: -2e8,
    capex: -1e8,
    fcf: -3e8,
  };
  const C = component("components/FinancialPicture.tsx", "FinancialPicture", {
    ...financialBindings,
    researchPeriods: () => [period],
  });
  const html = renderToStaticMarkup(
    React.createElement(C, { research: demoData.research.MSFT }),
  );
  assert.match(
    html,
    /data-tone="red"[^>]*>[\s\S]*?<title>Cash after capex: -\$300M<\/title>/,
  );
  assert.doesNotMatch(html, /data-tone="green"/);
});
