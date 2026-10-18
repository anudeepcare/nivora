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

test("Financials retains four primary metrics and statement rows with separate labelled detail groups", () => {
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
  assert.doesNotMatch(html, /supported metrics|Expand|Forecast|Market cap/);
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

test("Research outlook does not fill missing coverage with three empty scenario cards", async () => {
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
  assert.equal((html.match(/class="outcome"/g) || []).length, 0);
  assert.match(html, /Valuation snapshot/);
  assert(!html.includes('class="consensus-quick"'));
});

test("Product footer supplies copyright and a research disclosure without provider marketing", () => {
  const ProductFooter = loadComponent("components/Ui.tsx", "ProductFooter", {
    React,
    Help: ({ children, trigger }) =>
      React.createElement(
        "details",
        null,
        React.createElement("summary", null, trigger),
        children,
      ),
  });
  const html = renderToStaticMarkup(React.createElement(ProductFooter));
  assert.match(html, /All rights reserved/);
  assert.match(html, /Research disclosure/);
  assert.match(html, /not guarantees/);
  assert.doesNotMatch(html, /EODHD|Twelve Data/);
});

test("outlook displays the selected forecast end and horizon beside its cases", async () => {
  const { researchOutlook, consensusOutlook } = await import(
    "../lib/outlook.ts"
  );
  const Outlook = loadComponent(
    "components/ResearchOverview.tsx",
    "ResearchOutlook",
    {
      React,
      useMemo: React.useMemo,
      researchOutlook,
      consensusOutlook,
      ...format,
      Help: empty,
      DataStamp: empty,
    },
  );
  const r = structuredClone(demoData.research.MSFT);
  r.retrievedAt = "2026-10-17T00:00:00Z";
  r.quote = { ...r.quote, price: 100, currency: "USD", stale: false };
  r.evidence = {
    updatedAt: "2026-10-17",
    profile: { sector: "Technology", industry: "Software" },
    multiples: { ForwardPE: 20 },
    estimates: [
      {
        date: "2029-10-17",
        period: "FY2029",
        frequency: "Annual",
        currency: "USD",
        eps: 8,
        epsLow: 6,
        epsHigh: 10,
        analysts: 10,
      },
    ],
  };
  const html = renderToStaticMarkup(
    React.createElement(Outlook, { research: r }),
  );
  assert.match(html, /Forecast ends/);
  assert.match(html, /Oct 17, 2029/);
  assert.match(html, /36 months ahead/);
});

test("data details retain observation time without displaying infrastructure vendor names", () => {
  const Stamp = loadComponent("components/Ui.tsx", "DataStamp", {
    React,
    ...format,
    Help: ({ children }) => React.createElement("section", null, children),
  });
  for (const source of ["EODHD", "Twelve Data"]) {
    const html = renderToStaticMarkup(
      React.createElement(Stamp, { source, asOf: "2026-10-16T20:00:00Z" }),
    );
    assert.doesNotMatch(html, /EODHD|Twelve Data|Data attribution/);
    assert.match(html, /Observation:/);
  }
});

test("valuation snapshot separates analyst targets from closed mechanical forecast sensitivities", async () => {
  const { researchOutlook, consensusOutlook } = await import(
    "../lib/outlook.ts"
  );
  const Outlook = loadComponent(
    "components/ResearchOverview.tsx",
    "ResearchOutlook",
    {
      React,
      useMemo: React.useMemo,
      researchOutlook,
      consensusOutlook,
      ...format,
      Help: empty,
      DataStamp: empty,
    },
  );
  const r = structuredClone(demoData.research.MSFT);
  r.retrievedAt = "2026-10-18T00:00:00Z";
  r.quote = { ...r.quote, price: 100, currency: "USD", stale: false };
  r.evidence = {
    updatedAt: "2026-10-17",
    consensus: { target: 150 },
    profile: { sector: "Technology", industry: "Software" },
    multiples: { ForwardPE: 20 },
    estimates: [
      {
        date: "2029-10-17",
        period: "FY2029",
        frequency: "annual",
        currency: "USD",
        eps: 8,
        epsLow: 6,
        epsHigh: 10,
        analysts: 10,
      },
    ],
  };
  const html = renderToStaticMarkup(
    React.createElement(Outlook, { research: r }),
  );
  assert.match(html, /Analyst consensus/);
  assert.match(html, /Gap to consensus/);
  assert.match(html, /Not intrinsic fair value/);
  assert.match(html, /<details class="forecast-sensitivity">/);
  const primary = html.split('<details class="forecast-sensitivity">')[0];
  assert.doesNotMatch(primary, /\$160\.00|\$240\.00/);
  assert.match(primary, /\$150\.00/);
  assert.doesNotMatch(html, /margin of safety/i);
});
