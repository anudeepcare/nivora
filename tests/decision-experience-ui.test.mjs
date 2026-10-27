import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { paceCode } from "../lib/pace-presentation.ts";
import * as format from "../lib/format.ts";
import { approvedResearch } from "../lib/approved-research.ts";
import { sameProviderSymbol } from "../lib/provider-symbol.ts";
import { demoData } from "./fixtures/demo.ts";
function render(r, positions = []) {
  const ast = ts.createSourceFile(
    "ApprovedResearch.tsx",
    fs.readFileSync("components/ApprovedResearch.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const content = ast.statements
    .filter((x) => !ts.isImportDeclaration(x) && !ts.isTypeAliasDeclaration(x))
    .map((x) => x.getText(ast).replace("export default ", ""))
    .join("\n");
  const code = ts.transpileModule(content, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const bindings = {
    React,
    ...Object.fromEntries(
      [
        "ArrowUpRight",
        "Bell",
        "ChevronDown",
        "Sparkles",
        "ShieldCheck",
        "ArrowRight",
        "Activity",
      ].map((k) => [k, icons[k]]),
    ),
    ...format,
    approvedResearch,
    paceCode,
    PaceHelp: () => null,
    PaceGuidance: ({ view }) =>
      React.createElement("div", null, view.actionLabel, view.effectiveCode),
    PaceReadings: () => null,
    PriceRiskCases: () => null,
    sameProviderSymbol,
    useMemo: React.useMemo,
    useState: React.useState,
    useEffect: React.useEffect,
    useProduct: () => ({
      workspace: { positions },
      demo: { routePrefix: "/preview" },
    }),
    Link: ({ href, children, ...props }) =>
      React.createElement("a", { href, ...props }, children),
    Help: () => null,
    MovementContext: () => null,
    ResearchChanges: () => null,
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return ApprovedResearch;",
  )(...Object.values(bindings));
  return renderToStaticMarkup(
    React.createElement(View, { research: r, onTab: () => {} }),
  );
}
test("Research places an actual decision and Pace before expandable supporting metrics", () => {
  const r = demoData.research.MSFT,
    html = render(r);
  assert.match(html, /id="auryn-decision-title"/);
  assert.ok(
    html.indexOf("AURYN PACE") <
      html.indexOf("The details behind the decision"),
  );
  assert.doesNotMatch(html, /Weigh it yourself|evidence-scale|NaN|Infinity/);
  assert.match(html, /Decision rules &amp; source context/);
  assert.match(html, /class="decision-explanation" data-reason="accumulation"/);
  assert.match(html, /Accumulate gradually/);
});
test("share-class ownership aliases produce Add on the same supported research case", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.company.symbol = "BRK-B";
  r.evidence = undefined;
  r.history = [];
  r.quote = { ...r.quote, price: 50, asOf: r.retrievedAt, stale: false };
  const unowned = render(r),
    owned = render(r, [{ symbol: "BRK.B", quantity: 3 }]);
  assert.match(unowned, /<h2 id="auryn-decision-title">Buy<\/h2>/);
  assert.match(owned, /<h2 id="auryn-decision-title">Add<\/h2>/);
});
