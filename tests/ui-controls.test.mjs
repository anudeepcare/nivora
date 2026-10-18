import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
import { researchPeriods } from "../lib/financial-catalog.ts";
import { demoData } from "./fixtures/demo.ts";

function loadComponent(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  const code = ts.transpileModule(
    declaration
      .getText(ast)
      .replace("export default ", "")
      .replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), code + `;return ${name};`)(
    ...Object.values(bindings),
  );
}
const empty = () => null;

test("Financials renders the approved four metrics and four statement rows without extra metric panels", () => {
  const FinancialPicture = loadComponent(
    "components/FinancialPicture.tsx",
    "FinancialPicture",
    {
      React,
      useMemo: React.useMemo,
      useState: React.useState,
      researchPeriods,
      ...format,
      Help: ({ trigger }) => React.createElement("button", null, trigger),
      DataStamp: empty,
      Empty: empty,
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(FinancialPicture, { research: demoData.research.MSFT }),
  );
  assert.equal((html.match(/class="metric"/g) || []).length, 4);
  for (const label of [
    "Revenue",
    "Operating margin",
    "Cash after capex",
    "Net debt",
  ])
    assert(html.includes(label));
  assert.equal((html.match(/<tbody><tr>|<\/tr><tr>/g) || []).length, 4);
  assert.doesNotMatch(
    html,
    /supported metrics|Expand|Forecast|Market cap|Gross margin/,
  );
});

test("metric explanations do not inject dialog blocks into server-rendered paragraphs", () => {
  const Help = loadComponent("components/Ui.tsx", "Help", {
    React,
    useRef: React.useRef,
    useId: React.useId,
    useState: React.useState,
    useEffect: React.useEffect,
    CircleHelp: empty,
    X: empty,
  });
  const html = renderToStaticMarkup(
    React.createElement(
      "p",
      null,
      "Market value",
      React.createElement(
        Help,
        { label: "Market value" },
        React.createElement("p", null, "Quantity multiplied by price."),
      ),
    ),
  );
  assert.match(html, /aria-label="About Market value"/);
  assert.doesNotMatch(
    html,
    /<dialog|<div|<h2/,
    "Flow elements inside a paragraph let the browser repair the DOM before React hydrates it",
  );
});

test("empty focused search does not expose a nonexistent listbox to assistive technology", () => {
  const states = ["", [], true, -1, false, ""];
  const Search = loadComponent("components/Search.tsx", "Search", {
    React,
    useId: React.useId,
    useRef: React.useRef,
    useEffect: React.useEffect,
    useState: () => [states.shift(), empty],
    useProduct: () => ({}),
    useRouter: () => ({ push: empty }),
    SearchIcon: empty,
    X: empty,
    SecurityLogo: empty,
    ArrowUpRight: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Search));
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /aria-controls=|aria-activedescendant=/);
});

test("opening mobile search offers the account's saved instruments without fabricated suggestions", () => {
  const states = ["", [], false, -1, false, ""];
  const Search = loadComponent("components/Search.tsx", "Search", {
    React,
    useId: React.useId,
    useRef: React.useRef,
    useEffect: React.useEffect,
    useState: () => [states.shift(), empty],
    useProduct: () => ({
      workspace: {
        watchlist: [{ symbol: "ETH/USD" }, { symbol: "SAP" }],
        positions: [],
      },
      cache: new Map(),
    }),
    useRouter: () => ({ push: empty }),
    SearchIcon: empty,
    X: empty,
    SecurityLogo: empty,
    ArrowUpRight: empty,
  });
  const html = renderToStaticMarkup(
    React.createElement(Search, { autoFocus: true }),
  );
  assert.match(html, /Your saved instruments/);
  assert.match(html, /ETH\/USD/);
  assert.match(html, /SAP/);
  assert.doesNotMatch(html, /Grayscale|role="listbox"/);
});

test("Research outlook keeps the approved three-case structure when forecast coverage is missing", async () => {
  const { researchOutlook, consensusOutlook } = await import(
    "../lib/outlook.ts"
  );
  const { valuationScale } = await import("../lib/research-summary.ts");
  const Outlook = loadComponent(
    "components/ResearchOverview.tsx",
    "ResearchOutlook",
    {
      React,
      useMemo: React.useMemo,
      researchOutlook,
      consensusOutlook,
      valuationScale,
      ...format,
      Help: empty,
      DataStamp: empty,
    },
  );
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  const html = renderToStaticMarkup(
    React.createElement(Outlook, { research: r }),
  );
  assert.equal((html.match(/class="outcome"/g) || []).length, 3);
  for (const name of ["Bear", "Base", "Bull"]) assert(html.includes(name));
  assert(!html.includes('class="consensus-quick"'));
});
