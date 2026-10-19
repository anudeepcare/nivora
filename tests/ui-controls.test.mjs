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
      FinancialDetailTable: empty,
      ResearchWorkbench: empty,
      ResearchCompare: empty,
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
  assert.match(html, /aria-label="Income statement snapshot"/);
  assert.equal((html.match(/<dt>/g) || []).length, 4);
  assert.equal((html.match(/<dd class="num">/g) || []).length, 4);
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
    Link: ({children, ...props}) => React.createElement("a", props, children),
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

test("valuation snapshot separates analyst targets from visible labelled forecast scenarios", async () => {
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
  assert.match(html, /<details class="forecast-sensitivity" open="">/);
  const primary = html.split(
    '<details class="forecast-sensitivity" open="">',
  )[0];
  assert.doesNotMatch(primary, /\$160\.00|\$240\.00/);
  assert.match(primary, /\$150\.00/);
  assert.doesNotMatch(html, /margin of safety/i);
});
test("financial trend scope controls remain available for a missing selected period", () => {
  const Component = loadComponent(
    "components/ResearchWorkbench.tsx",
    "ResearchWorkbench",
    {
      React,
      useMemo: React.useMemo,
      useState: () => ["quarterly", () => {}],
      financialTrend: () => [],
      ...format,
      Download: empty,
      downloadCsv: () => {},
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, { research: demoData.research.MSFT }),
  );
  assert.match(html, /Annual/);
  assert.match(html, /Quarterly/);
  assert.match(html, /No comparable quarterly/);
});
test("Home portfolio summary retains key figures without the full allocation panel", async () => {
  const { holdingsContext } = await import("../lib/holdings-brief.ts");
  const Component = loadComponent(
    "components/PortfolioContext.tsx",
    "PortfolioContext",
    {
      React,
      useProduct: () => ({
        workspace: {
          positions: [
            {
              id: "1",
              symbol: "APP",
              quantity: 2,
              cost: 10,
              assetType: "stock",
              currency: "USD",
            },
          ],
        },
        cache: new Map(),
      }),
      holdingsContext,
      ...format,
    },
  );
  const quotes = {
    APP: { price: 100, currency: "USD", stale: false, changePct: 1 },
  };
  const compact = renderToStaticMarkup(
    React.createElement(Component, { quotes, compact: true }),
  );
  const detailed = renderToStaticMarkup(
    React.createElement(Component, { quotes }),
  );
  assert.match(compact, /\$200\.00/);
  assert.doesNotMatch(compact, /class="exposure-list"/);
  assert.match(detailed, /class="exposure-list"/);
});

test("Analyst ratings preserve missing counts separately from reported zero", () => {
  const Component = loadComponent(
    "components/AnalystRatings.tsx",
    "AnalystRatings",
    {
      React,
      consensusOutlook: () => null,
      amount: format.amount,
      dateLabel: format.dateLabel,
    },
  );
  const research = {
    company: { symbol: "HIMS" },
    quote: { currency: "USD" },
    retrievedAt: "2026-10-18",
    evidence: {
      consensus: {
        rating: null,
        strongBuy: 0,
        buy: 2,
        hold: null,
        sell: 0,
        strongSell: null,
      },
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(Component, { research }),
  );
  assert.match(html, /Recommendation distribution/);
  assert.match(html, /Reported recommendations/);
  assert.match(html, /<b>0<\/b>/);
  assert.match(html, /<b>—<\/b>/);
  assert.match(html, /not necessarily unique analysts/i);
});
test("Analyst ratings do not invent a distribution when counts are absent", () => {
  const Component = loadComponent(
    "components/AnalystRatings.tsx",
    "AnalystRatings",
    {
      React,
      consensusOutlook: () => null,
      amount: format.amount,
      dateLabel: format.dateLabel,
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: {
        company: { symbol: "SAP" },
        quote: { currency: "USD" },
        retrievedAt: "2026-10-18",
      },
    }),
  );
  assert.match(html, /counts are not supplied/);
  assert.doesNotMatch(html, /class="rating-track"/);
});

test("Overview context stays concise and does not assign quote currency to upcoming EPS", () => {
  const Component = loadComponent(
    "components/OverviewContext.tsx",
    "OverviewContext",
    {
      React,
      consensusOutlook: () => null,
      researchOutlook: () => ({ available: false }),
      amount: format.amount,
      percent: format.percent,
      dateLabel: format.dateLabel,
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: {
        company: { symbol: "SAP" },
        quote: { currency: "USD" },
        retrievedAt: "2026-10-18",
        evidence: { earnings: [{ date: "2026-10-25", estimate: 99.99 }] },
      },
    }),
  );
  assert.match(html, /Next earnings report/);
  assert.doesNotMatch(html, /99\.99|Actual EPS|Earnings checkpoints/);
  assert.match(html, /Scenarios need comparable/);
});

test("News earnings do not infer estimate currency from a stock listing or company accounts", () => {
  const Component = loadComponent(
    "components/CompanyUpdates.tsx",
    "CompanyUpdates",
    {
      React,
      amount: format.amount,
      dateLabel: format.dateLabel,
      NewsAndFilings: empty,
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: {
        quote: { currency: "USD" },
        retrievedAt: "2026-10-18",
        evidence: {
          reportingCurrency: "EUR",
          earnings: [{ date: "2026-10-25", estimate: 1.25 }],
        },
      },
    }),
  );
  assert.match(html, /1\.25/);
  assert.doesNotMatch(html, /\$1\.25|€1\.25/);
  assert.match(html, /currency.*not supplied/i);
});

test('public legal and help documents render all cross-links and readable sections',async()=>{
 const {documents,legalConfiguration}=await import('../lib/legal-content.ts');
 const LegalDocument=loadComponent('components/LegalDocument.tsx','LegalDocument',{React,useState:React.useState,documents,legalConfiguration,Link:({children,...props})=>React.createElement('a',props,children)});
 for(const id of ['terms','privacy','risk','methodology','help']){
  const html=renderToStaticMarkup(React.createElement(LegalDocument,{id}));
  for(const path of ['terms','privacy','risk','methodology','help'])assert.ok(html.includes(`href="/${path}"`));
  assert.ok(html.includes('<h1>'));assert.ok(html.includes('document-sections'));
  assert.doesNotMatch(html,/mobile-dock|desktop-nav/);
 }
});

test('decision overview renders real evidence, eight lenses and direct research paths',async()=>{
 const {researchDecision,styles}=await import('../lib/decision-research.ts');
 const {consensusOutlook}=await import('../lib/outlook.ts');
 const bindings={React,useMemo:React.useMemo,useState:React.useState,researchDecision,styles,consensusOutlook,...format,useResearchPreferences:()=>({preferences:{style:'Balanced',detail:'essential',horizon:'long'},setPreferences:()=>{}}),Link:({children,...props})=>React.createElement('a',props,children),ShieldCheck:empty,CalendarDays:empty,ArrowUpRight:empty};
 const evidenceValue=loadComponent('components/DecisionWorkspace.tsx','evidenceValue',bindings);
 const DecisionWorkspace=loadComponent('components/DecisionWorkspace.tsx','DecisionWorkspace',{...bindings,evidenceValue});
 const html=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{}}));
 assert.match(html,/Investment evidence overview/);assert.match(html,/Evidence lenses/);
 assert.match(html,/What does the price imply/);assert.match(html,/Challenge the case/);
 assert.match(html,/href="\/methodology"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 const summary=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{},part:'summary'}));
 const detail=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{},part:'detail'}));
 assert.doesNotMatch(summary,/<svg|Evidence lenses|Supports the case/);
 assert.match(summary,/What does the price imply/);
 assert.match(detail,/Evidence lenses/);assert.doesNotMatch(detail,/decision-answer-grid/);
});

test('valuation tool withholds unsupported models rather than fabricating sensitivities',async()=>{
 const engine=await import('../lib/decision-research.ts');
 const ValuationLab=loadComponent('components/ValuationLab.tsx','ValuationLab',{React,useMemo:React.useMemo,useState:React.useState,...engine,...format});
 const html=renderToStaticMarkup(React.createElement(ValuationLab,{research:{...demoData.research.MSFT,facts:[],evidence:undefined}}));
 assert.match(html,/Use the right model/);assert.doesNotMatch(html,/type="range"|NaN|Infinity/);
});

test('authentication explains AURYN in sign-in, signup and recovery without fabricating investment results',()=>{
 for(const mode of ['login','signup','reset']){
  let i=0;const values=['','','',false,mode,''];
  const Login=loadComponent('components/Session.tsx','Login',{React,useState:()=>[values[i++],()=>{}],Logo:()=>React.createElement('span',null,'AURYN')});
  const html=renderToStaticMarkup(React.createElement(Login,{initialError:''}));
  assert.match(html,/About AURYN/);assert.match(html,/Business first/);assert.match(html,/Explore the possibilities/);
  assert.doesNotMatch(html,/desktop-nav|mobile-dock|guaranteed returns/);
 }
});
test('settings hides experimental navigation while preserving account and help',()=>{
 const SettingsSheet=loadComponent('components/SettingsSheet.tsx','SettingsSheet',{React,useState:React.useState,useProduct:()=>({demo:false,themePreference:'light',textSize:'standard',reduceMotion:false}),Link:({children,...props})=>React.createElement('a',props,children),ArrowRight:empty,X:empty,LogOut:empty,ResearchPreferenceControls:empty});
 const html=renderToStaticMarkup(React.createElement(SettingsSheet,{dialog:{current:null}}));
 assert.doesNotMatch(html,/href="\/(discover|research-lab|trading)"/);
 assert.match(html,/Account &amp; security/);assert.match(html,/href="\/help"/);
});
