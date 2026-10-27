import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { customerText } from "../lib/customer-language.ts";
import { PACE_EXPLANATION, PACE_LEVELS } from "../lib/pace-presentation.ts";
function load(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
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
  return new Function(...Object.keys(bindings), code + `;return ${name};`)(
    ...Object.values(bindings),
  );
}
test("financial empty state preserves source failure details without customer-facing vendor names", () => {
  const View = load("components/Financials.tsx", "Financials", {
    React,
    customerText,
    useState: React.useState,
    useMemo: React.useMemo,
    useRef: React.useRef,
    researchPeriods: () => [],
    applicableMetrics: () => [],
    s: {},
    X: () => null,
    Empty: ({ title, children }) =>
      React.createElement("div", null, title, children),
  });
  const html = renderToStaticMarkup(
    React.createElement(View, {
      research: { issues: ["EODHD financial dataset is unavailable"] },
    }),
  );
  assert.doesNotMatch(html, /EODHD/i);
  assert.match(html, /financial dataset is unavailable/);
});
test("shared Pace help explains confirmation for both monthly and weekly periods", () => {
  const View = load("components/PaceHelp.tsx", "PaceHelp", {
    React,
    PACE_EXPLANATION,
    PACE_LEVELS,
    Help: ({ children }) => React.createElement("section", null, children),
  });
  const html = renderToStaticMarkup(React.createElement(View));
  assert.match(html, /completed period/);
  assert.match(html, /period ends/);
  assert.doesNotMatch(html, /until month-end/);
});
