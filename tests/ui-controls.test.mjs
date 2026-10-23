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
  bindings = {AnalystTargets: () => null, ...bindings};
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

test("Financials avoids duplicate overview tiles and retains statement rows with labelled detail groups", () => {
  const FinancialPicture = loadComponent(
    "components/FinancialPicture.tsx",
    "FinancialPicture",
    {
      React,
      useMemo: React.useMemo,
      useState: React.useState,
      FinancialDetailTable: empty,
      FinancialExplorer: empty,
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
  assert.equal((html.match(/class="metric"/g) || []).length, 0);
  for (const label of [
    "Revenue",
    "Operating margin",
    "Net income",
    "SBC / revenue",
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
      CaseRange: empty,
      consensusOutlook,
      CaseRange: empty,
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
      CaseRange: empty,
      consensusOutlook,
      CaseRange: empty,
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
    assert.ok(html.includes(format.quoteTime("2026-10-16T20:00:00Z")));
    assert.doesNotMatch(html,/Data details|data-help/);
  }
});

test("valuation snapshot separates analyst targets from opt-in exploratory sensitivities", async () => {
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
      CaseRange: empty,
      consensusOutlook,
      CaseRange: empty,
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
  assert.match(html, /<details class="forecast-sensitivity" open/);
  assert.match(html, /Bear, base &amp; bull|Exploratory forecast-multiple sensitivity/);
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
  assert.match(html, /Fair value is not established/);
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
 const {openingAssessment}=await import('../lib/connected-product.ts');
 const bindings={React,useMemo:React.useMemo,useState:React.useState,researchDecision,styles,openingAssessment,...format,useResearchPreferences:()=>({preferences:{style:'Balanced',detail:'essential',horizon:'long'},setPreferences:()=>{}}),Link:({children,...props})=>React.createElement('a',props,children),ShieldCheck:empty,CalendarDays:empty,ArrowUpRight:empty};
 const evidenceValue=loadComponent('components/DecisionWorkspace.tsx','evidenceValue',bindings);
 const DecisionWorkspace=loadComponent('components/DecisionWorkspace.tsx','DecisionWorkspace',{...bindings,evidenceValue});
 const html=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{}}));
 assert.match(html,/Investment evidence overview/);assert.match(html,/Evidence lenses/);
 assert.match(html,/Valuation/);assert.match(html,/Challenge the case/);
 assert.match(html,/href="\/methodology"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 const summary=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{},part:'summary'}));
 const detail=renderToStaticMarkup(React.createElement(DecisionWorkspace,{research:demoData.research.MSFT,onTab:()=>{},part:'detail'}));
 assert.doesNotMatch(summary,/<svg|Evidence lenses|Supports the case/);
 assert.match(summary,/Valuation/);
 assert.match(detail,/Evidence lenses/);assert.doesNotMatch(detail,/decision-answer-grid/);
});

test('valuation tool withholds unsupported models rather than fabricating sensitivities',async()=>{
 const engine=await import('../lib/decision-research.ts');
 const outlook=await import('../lib/outlook.ts');
 const ValuationMethods=loadComponent('components/ValuationMethods.tsx','ValuationMethods',{React,...outlook,...format});
 const ValuationLab=loadComponent('components/ValuationLab.tsx','ValuationLab',{React,useMemo:React.useMemo,useState:React.useState,ValuationMethods,...engine,...format});
 const html=renderToStaticMarkup(React.createElement(ValuationLab,{research:{...demoData.research.MSFT,facts:[],evidence:undefined}}));
 assert.match(html,/Use the right model/);assert.doesNotMatch(html,/type="range"|NaN|Infinity/);
});

test('authentication explains AURYN in sign-in, signup and recovery without fabricating investment results',()=>{
 for(const mode of ['login','signup','reset']){
  let i=0;const values=['','','',false,mode,'',{google:false,x:false}];
  const Login=loadComponent('components/Session.tsx','Login',{React,useRouter:()=>({replace:()=>{}}),useEffect:()=>{},useState:()=>[values[i++],()=>{}],Logo:()=>React.createElement('span',null,'AURYN')});
  const html=renderToStaticMarkup(React.createElement(Login,{initialError:''}));
  if(mode!=="reset"){assert.match(html,/Social sign-in is not enabled yet/);assert.match(html,/disabled=""/);}
  assert.match(html,/About AURYN/);assert.match(html,/A clearer perspective/);assert.match(html,/Business, value and timing/);
  assert.doesNotMatch(html,/desktop-nav|mobile-dock|guaranteed returns/);
 }
});
test('settings hides experimental navigation while preserving account and help',()=>{
 const SettingsSheet=loadComponent('components/SettingsSheet.tsx','SettingsSheet',{React,useState:React.useState,useProduct:()=>({demo:false,themePreference:'light',textSize:'standard',reduceMotion:false}),Link:({children,...props})=>React.createElement('a',props,children),ArrowRight:empty,X:empty,LogOut:empty,ResearchPreferenceControls:empty,DisplayPreferences:empty});
 const html=renderToStaticMarkup(React.createElement(SettingsSheet,{dialog:{current:null}}));
 assert.doesNotMatch(html,/href="\/(discover|research-lab|trading)"/);
 assert.match(html,/Account &amp; security/);assert.match(html,/href="\/help"/);assert.match(html,/Settings sections/);assert.match(html,/id="settings-account" hidden/);assert.doesNotMatch(html,/<details/);
});

test('scenario presentation uses one shared scale and keeps current price outside the range when appropriate',async()=>{
 const {valuationScale}=await import('../lib/research-summary.ts');
 const CaseRange=loadComponent('components/CaseRange.tsx','CaseRange',{React,valuationScale,...format});
 const html=renderToStaticMarkup(React.createElement(CaseRange,{cases:[{name:'Bear',target:10,change:-80},{name:'Base',target:20,change:-60},{name:'Bull',target:30,change:-40}],price:50,currency:'USD'}));
 assert.match(html,/Shared linear price scale/);assert.match(html,/Current/);assert.match(html,/\$50\.00/);assert.doesNotMatch(html,/scenario-bar|NaN|Infinity/);
});

test('change tracking stays invisible until there are actual observed changes',()=>{
 const ResearchChanges=loadComponent('components/ResearchChanges.tsx','ResearchChanges',{React,useState:React.useState,useRef:React.useRef,useEffect:()=>{},useProduct:()=>({cache:new Map(),owner:'test',demo:undefined})});
 const html=renderToStaticMarkup(React.createElement(ResearchChanges,{research:demoData.research.MSFT}));
 assert.equal(html,'');
});

test('technical desk separates four evidence groups and formats missing data safely',async()=>{
 const {advancedStudies}=await import('../lib/advanced-research.ts'),{professionalStudies}=await import('../lib/professional-studies.ts'),{expandedStudies}=await import('../lib/technical-expanded.ts'),{priceStudies}=await import('../lib/price-studies.ts'),{perspective}=await import('../lib/analysis.ts');
 const {technicalContext}=await import('../lib/technical-context.ts');
 const TechnicalDashboard=loadComponent('components/TechnicalDashboard.tsx','TechnicalDashboard',{React,useMemo:React.useMemo,useRef:React.useRef,technicalContext,advancedStudies,professionalStudies,expandedStudies,priceStudies,perspective,...format,TechnicalLevels:()=>null,X:()=>null});
 const html=renderToStaticMarkup(React.createElement(TechnicalDashboard,{research:demoData.research.MSFT}));for(const title of ['Trend','Momentum','Volatility &amp; range','Participation','Price reference map','Custom anchors'])assert.ok(html.includes(title),title);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
});

test('shared settings exposes theme and accessibility without repeating accent headings',()=>{
 const DisplayPreferences=loadComponent('components/DisplayPreferences.tsx','DisplayPreferences',{React,useProduct:()=>({themePreference:'dark',textSize:'large',reduceMotion:true}),AppearanceControls:empty,ResearchModeSwitch:empty});
 const html=renderToStaticMarkup(React.createElement(DisplayPreferences));
 assert.match(html,/Make it yours/);assert.match(html,/aria-label="Appearance"/);assert.match(html,/aria-label="Text size"/);assert.match(html,/aria-label="Reduce motion" aria-pressed="true"/);assert.match(html,/aria-pressed="true" class="active">Dark/);
});

test('portfolio ledger renders identity, value, return and edit as separate named cells',async()=>{
 const {ledgerRows}=await import('../lib/portfolio-ledger.ts');
 const PortfolioLedger=loadComponent('components/PortfolioLedger.tsx','PortfolioLedger',{React,useMemo:React.useMemo,useState:React.useState,ledgerRows,...format,Link:({children,...props})=>React.createElement('a',props,children),SecurityLogo:empty,Wallet:empty,MoreHorizontal:empty});
 const p={id:'1',symbol:'HIMS',quantity:3700,cost:34.4,currency:'USD',assetType:'stock'};
 const html=renderToStaticMarkup(React.createElement(PortfolioLedger,{positions:[p],allPositions:[p],quotes:{HIMS:{price:28.39,stale:false,currency:'USD',asOf:'2026-10-19T15:00:00Z'}},companies:{HIMS:{name:'Hims & Hers Health'}},total:1000000,earnings:new Set(),prefix:'',onEdit:()=>{}}));
 assert.match(html,/href="\/research\/HIMS"/);assert.match(html,/\$105,043.00/);assert.match(html,/Edit HIMS/);assert.match(html,/Concentration ≥10%/);assert.doesNotMatch(html,/Price current|NaN|Infinity|undefined/);
});
test('portfolio allocation chart combines duplicate holdings and discloses excluded pricing',async()=>{
 const {portfolioChartData}=await import('../lib/portfolio-ledger.ts');
 const PortfolioCharts=loadComponent('components/PortfolioCharts.tsx','PortfolioCharts',{React,useMemo:React.useMemo,useState:React.useState,portfolioChartData,...format});
 const p={id:'1',symbol:'A',quantity:2,cost:50,currency:'USD',assetType:'stock'};
 const html=renderToStaticMarkup(React.createElement(PortfolioCharts,{positions:[p,{...p,id:'2',symbol:'B'}],quotes:{A:{price:100,currency:'USD',stale:false}}}));
 assert.match(html,/Allocation/);assert.match(html,/Gain \/ loss/);assert.match(html,/100.0%/);assert.match(html,/1 unpriced instruments excluded/);assert.doesNotMatch(html,/NaN|Infinity/);
});
test('portfolio gain-loss chart keeps losses signed and never presents a return history',async()=>{
 const {portfolioChartData}=await import('../lib/portfolio-ledger.ts');
 const PortfolioCharts=loadComponent('components/PortfolioCharts.tsx','PortfolioCharts',{React,useMemo:React.useMemo,useState:()=>['returns',()=>{}],portfolioChartData,...format});
 const p={id:'1',symbol:'A',quantity:2,cost:100,currency:'USD',assetType:'stock'};
 const html=renderToStaticMarkup(React.createElement(PortfolioCharts,{positions:[p],quotes:{A:{price:50,currency:'USD',stale:false}}}));
 assert.match(html,/\-\$100.00 unrealized/);assert.match(html,/class="loss"/);assert.match(html,/not daily performance or total returns/);
});

test('account equity displays debt separately without representing it as a losing holding', async () => {
 const {accountEquity}=await import('../lib/account-balances.ts');
 const AccountBalances=loadComponent('components/AccountBalances.tsx','AccountBalances',{
  React,useState:React.useState,useEffect:React.useEffect,useProduct:()=>({demo:false}),
  useResource:()=>({data:{balances:{margin_debt:116312,managed_value:null,updated_at:'2026-10-19T16:00:00Z'}},error:'',refresh:()=>{}}),
  accountEquity,...format,preview:{balances:null},api:()=>{throw Error('SSR must not save');}
 });
 const html=renderToStaticMarkup(React.createElement(AccountBalances,{assets:800000,ready:true,missing:1}));
 assert.match(html,/Net equity/);assert.match(html,/683,688/);assert.match(html,/116,312/);assert.match(html,/Managed portfolio not included/);assert.match(html,/Partial equity/);
});

test('public sample explains fictional data and offers readable business, value and discipline tabs without account APIs',()=>{
 const PublicSample=loadComponent('components/PublicLanding.tsx','PublicSample',{React,useState:React.useState,Check:empty,Layers3:empty});
 const html=renderToStaticMarkup(React.createElement(PublicSample));assert.match(html,/not a real investment/);assert.match(html,/aria-label="Preview perspective"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/Business/);assert.match(html,/Timing/);assert.match(html,/shared linear scale/);assert.doesNotMatch(html,/90%|guaranteed|buy now|api_key/i);
});

test('monthly chart distinguishes unavailable warm-up data from ordinary 1x conditions',async()=>{
 const {researchAccumulation,adaptiveSettledBars}=await import('../lib/accumulation-policy-v4.ts'),{evaluateAccumulation}=await import('../lib/accumulation-evaluation.ts');
 const colours={0:'#d89a20',1:'#7d9db0',2:'#12a28b',3:'#71b337',4:'#ac68e5'};
 const Desk=loadComponent('components/AccumulationDesk.tsx','AccumulationDesk',{React,useMemo:React.useMemo,useState:React.useState,researchAccumulation,adaptiveSettledBars,evaluateAccumulation,...format,colours,PriceChart:({candleColors})=>React.createElement('span',{'data-zone-colours':JSON.stringify(candleColors)})});
 const html=renderToStaticMarkup(React.createElement(Desk,{research:demoData.research.MSFT}));assert.match(html,/No eligible signal/);assert.match(html,/#b0b5bd/);assert.match(html,/Cycle-relative/);assert.match(html,/confirmed/);assert.match(html,/forming/);
});

test('metric provenance links filings but never sends users to infrastructure API pages',()=>{
 const Source=loadComponent('components/Ui.tsx','Source',{React,ArrowUpRight:empty});
 for(const href of ['https://eodhd.com/api/fundamentals/IREN.US','https://eodhd.com/financial-apis','https://twelvedata.com/docs'])assert.equal(renderToStaticMarkup(React.createElement(Source,{href},'Source 1')),'');
 const html=renderToStaticMarkup(React.createElement(Source,{href:'https://www.sec.gov/Archives/edgar/data/1/'},'Filing'));
 assert.match(html,/sec.gov/);assert.match(html,/Filing/);
});

test('visual overview keeps the chart, scenarios, catalyst and risk visible without diagnostic expansion',async()=>{
 const {researchBrief}=await import('../lib/research-brief.ts');
 const b=researchBrief(demoData.research.MSFT);
 const View=loadComponent('components/DecisionOverview.tsx','DecisionOverview',{React,useMemo:React.useMemo,researchBrief:()=>b,...format,PositionAwareResearch:empty,CaseRange:()=>React.createElement('div',{'data-scenarios':'visible'})});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT,onTab:()=>{},chart:React.createElement('div',{'data-chart':'visible'})}));
 assert.doesNotMatch(html,/Completed-price studies/);
 const pro=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT,onTab:()=>{},pro:true}));assert.match(pro,/Completed-price studies/);
 if(b.scenarioEligible)assert.match(html,/data-scenarios="visible"/);else assert.doesNotMatch(html,/data-scenarios="visible"/);assert.match(html,/Bear, base &amp; bull|Analyst expectations|Fair value not established/);
 assert.match(html,/data-chart="visible"/);assert.match(html,/Accumulation/);assert.match(html,/Next report/);assert.match(html,/Main risk/);assert.match(html,/Confirmed and forming monthly conditions/);assert.match(html,/Business in motion/);assert.match(html,/Reported annual periods/);
 assert.doesNotMatch(html,/Why this assessment|available metrics|decision-evidence-grid|research-brief-v2|T\d{2}:\d{2}:\d{2}/);
});


test('analyst fallback presents actual consensus without invented low/high targets',async()=>{
 const {consensusOutlook}=await import('../lib/outlook.ts');
 const r=JSON.parse(fs.readFileSync('tests/fixtures/iren-observed-20261019.json','utf8'));
 const View=loadComponent('components/AnalystTargets.tsx','AnalystTargets',{React,consensusOutlook,...format});
 const html=renderToStaticMarkup(React.createElement(View,{research:r}));
 r.quote.stale=true;
 const older=renderToStaticMarkup(React.createElement(View,{research:r}));
 assert.match(older,/\$77\.81/);assert.match(older,/Versus older quote/);
 r.quote.price=null;const missing=renderToStaticMarkup(React.createElement(View,{research:r}));
 assert.match(missing,/\$77\.81/);assert.match(missing,/Price comparison unavailable/);
 assert.match(html,/\$77\.81/);assert.match(html,/Wall Street consensus/);assert.match(html,/low\/high range not supplied/);assert.doesNotMatch(html,/\$37\.00|\$139\.00|Bear|Bull/);
});

test('Advanced opens with a readable risk brief and keeps planning tools off the initial screen',async()=>{
 const {advancedStudies,tradePlan}=await import('../lib/advanced-research.ts'),{planStress}=await import('../lib/professional-studies.ts');
 const Advanced=loadComponent('components/AdvancedResearch.tsx','AdvancedResearch',{React,useMemo:React.useMemo,useState:React.useState,advancedStudies,tradePlan,planStress,...format,AdvancedDashboard:()=>React.createElement('section',{'data-risk-brief':'visible'},'Typical daily movement'),ProfessionalContext:empty,MarketContext:()=>{throw Error('Market must not load before selected');},HistoricalConditions:()=>{throw Error('Study must not load before selected');},TradeReference:empty});
 const html=renderToStaticMarkup(React.createElement(Advanced,{research:demoData.research.MSFT}));assert.match(html,/data-risk-brief="visible"/);assert.match(html,/Risk &amp; conditions/);assert.doesNotMatch(html,/href="#advanced|Assumed win probability|type="number"|DISCONNECT/);
});
test('risk brief exposes dated actual measurements with explanations and no assumed success rate',async()=>{
 const {riskBrief}=await import('../lib/risk-brief.ts');
 const Brief=loadComponent('components/AdvancedRiskBrief.tsx','AdvancedRiskBrief',{React,useMemo:React.useMemo,riskBrief,...format});
 const html=renderToStaticMarkup(React.createElement(Brief,{research:demoData.research.MSFT}));assert.match(html,/Typical daily movement/);assert.match(html,/worst 5%/);assert.match(html,/Largest observed opening gap/);assert.doesNotMatch(html,/NaN|Infinity|50% win|probability forecast/);
});
test('overview does not ask users to resolve infrastructure inputs or replace business risk with data diagnostics',async()=>{
 const {researchBrief}=await import('../lib/research-brief.ts'),b=researchBrief({...demoData.research.MSFT,evidence:{...demoData.research.MSFT.evidence,reportingCurrency:'USD',ownership:{outstanding:100},highlights:{MarketCapitalization:1e12}}});
 const View=loadComponent('components/DecisionOverview.tsx','DecisionOverview',{React,useMemo:React.useMemo,researchBrief:()=>b,...format,PositionAwareResearch:empty,CaseRange:empty});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT,onTab:()=>{}}));assert.doesNotMatch(html,/Resolve conflicting inputs|Input conflict/);assert.match(html,/metric-sparkline/);assert.match(html,/What changes the case/);assert.match(html,/Calculation basis/);
});

test('weekly accumulation has its own history, date labels and no misleading monthly simulation',async()=>{
 const {weeklyAccumulation}=await import('../lib/accumulation-weekly.ts');
 const {researchAccumulation,adaptiveSettledBars}=await import('../lib/accumulation-policy-v4.ts');
 const {evaluateAccumulation}=await import('../lib/accumulation-evaluation.ts');
 const colours={0:'#d89a20',1:'#7d9db0',2:'#12a28b',3:'#71b337',4:'#ac68e5'};
 let state=0;
 const View=loadComponent('components/AccumulationDesk.tsx','AccumulationDesk',{React,useMemo:React.useMemo,useState:(initial)=>React.useState(++state===1?'weekly':initial),weeklyAccumulation,researchAccumulation,adaptiveSettledBars,evaluateAccumulation,...format,colours,PriceChart:empty});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 assert.match(html,/Weekly conditions/);assert.match(html,/Accumulation time horizon/);assert.match(html,/Last confirmed week/);assert.match(html,/52 completed weeks/);assert.match(html,/historical simulation remains monthly only/);assert.doesNotMatch(html,/Test this policy on available history|Same deposits/);
});

test('Business starts with reported durability charts and keeps missing annual values unplotted',async()=>{
 const {businessHistory}=await import('../lib/business-history.ts');
 const View=loadComponent('components/BusinessHistory.tsx','BusinessHistory',{React,useMemo:React.useMemo,businessHistory,...format});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 assert.match(html,/aria-label="Revenue history"/);assert.match(html,/aria-label="Cash after capex history"/);assert.match(html,/Annual reported evidence/);
 const empty=renderToStaticMarkup(React.createElement(View,{research:{...demoData.research.MSFT,facts:[]}}));assert.equal(empty,'');
});

test('financial explorer presents selectable metrics and honest chart dates without adding paid data requests',async()=>{
 const {financialMetricSeries}=await import('../lib/financial-explorer.ts'),{applicableMetrics}=await import('../lib/financial-catalog.ts');
 const View=loadComponent('components/FinancialExplorer.tsx','FinancialExplorer',{React,useMemo:React.useMemo,useState:React.useState,financialMetricSeries,applicableMetrics,...format});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 for(const label of ['Financial chart metric','Financial metrics','Financial chart style','Reported observations','SBC / revenue','Revenue by reported period'])assert.ok(html.includes(label),label);assert.doesNotMatch(html,/NaN|Infinity|api_key|Download/);
});

test('overview leads with the forming DCA period and keeps the confirmed result separately labelled',async()=>{
 const {researchBrief}=await import('../lib/research-brief.ts');
 const b=researchBrief(demoData.research.MSFT);
 b.accumulation={...b.accumulation,multiplier:1,month:'2026-09',reason:'Confirmed baseline reason',forming:{month:'2026-10',date:'2026-10-22',close:25.51,multiplier:2,reason:'Current pullback reason'}};
 const View=loadComponent('components/DecisionOverview.tsx','DecisionOverview',{React,useMemo:React.useMemo,researchBrief:()=>b,...format,PositionAwareResearch:empty,CaseRange:empty});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT,onTab:()=>{}}));
 const hero=html.match(/class="overview-multiplier"[\s\S]*?class="overview-zone-scale"/)?.[0];
 assert.match(hero,/<strong>2×<\/strong>/);
 assert.match(hero,/2026-10 · forming/);
 assert.match(html,/Forming 2 times condition/);
 assert.match(html,/Current pullback reason/);
 assert.doesNotMatch(html,/Confirmed baseline reason/);
 assert.match(html,/Confirmed · 2026-09/);
 assert.match(html,/<b>1×<\/b>/);
 b.accumulation.forming=null;
 const closed=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT,onTab:()=>{}}));
 assert.match(closed,/2026-09 · confirmed/);assert.match(closed,/Confirmed baseline reason/);
});

test('technical accumulation leads with the same forming reading and retains confirmed history frequency',()=>{
 const confirmed={multiplier:1,month:'2026-09',date:'2026-09-30',close:40.88,reason:'Confirmed baseline',risk:'Confirmed risk',buy2:30,buy3:20,buy4:10};
 const forming={...confirmed,multiplier:2,month:'2026-10',date:'2026-10-22',reason:'Forming pullback',risk:'Current trend risk',buy2:31};
 const chosen={confirmed,forming,history:[confirmed],reason:'Enough history'};
 const View=loadComponent('components/AccumulationDesk.tsx','AccumulationDesk',{React,useMemo:React.useMemo,useState:React.useState,researchAccumulation:()=>chosen,adaptiveSettledBars:()=>[],evaluateAccumulation:()=>null,...format,colours:{0:'#d89a20',1:'#7d9db0',2:'#12a28b',3:'#71b337',4:'#ac68e5'},PriceChart:({levels})=>React.createElement('span',{'data-first-level':levels[0]?.price})});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 assert.match(html,/class="accumulation-badge"[^>]*>2×/);
 assert.match(html,/Current month · forming/);assert.match(html,/Forming pullback/);
 assert.match(html,/Last confirmed month/);assert.match(html,/1× · confirmed · Sep 30, 2026/);
 assert.match(html,/1 of 1 eligible months/);assert.match(html,/data-first-level="31"/);
});

test('News leads with company coverage before earnings and transaction records',()=>{
 const View=loadComponent('components/CompanyUpdates.tsx','CompanyUpdates',{React,dateLabel:format.dateLabel,NewsAndFilings:()=>React.createElement('section',{'data-news':'first'},'Company headlines and filings')});
 const html=renderToStaticMarkup(React.createElement(View,{research:{retrievedAt:'2026-10-22',evidence:{earnings:[]}}}));
 assert.ok(html.indexOf('data-news="first"')<html.indexOf('Events &amp; reported transactions'));
});

test('new Advanced dashboard exposes actual distributions and risk charts with no input forms or invented success rate',async()=>{
 const {advancedDesk}=await import('../lib/research-desks.ts');
 const View=loadComponent('components/AdvancedDashboard.tsx','AdvancedDashboard',{React,useMemo:React.useMemo,advancedDesk,...format});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 assert.match(html,/Historical drawdown from the running closing peak/);assert.match(html,/Return distribution/);assert.match(html,/Typical daily traded value/);assert.match(html,/Volatility regime/);assert.doesNotMatch(html,/NaN|Infinity|type="number"|win probability/);
});

test('stock context uses supplied completed price studies and does not invent a corporate multiple for crypto',async()=>{
 const {advancedStudies}=await import('../lib/advanced-research.ts');
 const View=loadComponent('components/StockFacts.tsx','StockFacts',{React,useMemo:React.useMemo,advancedStudies,...format});
 const r={...demoData.research.MSFT,company:{...demoData.research.MSFT.company,assetType:'crypto'},evidence:{multiples:{ForwardPE:20}}};
 const html=renderToStaticMarkup(React.createElement(View,{research:r}));assert.match(html,/20-session move/);assert.doesNotMatch(html,/Forward P\/E|NaN|Infinity/);
});

test('new operating expectations begins with explicit future inputs and never guesses a valuation',async()=>{
 const {latestFinancialEvidence}=await import('../lib/analysis.ts');const {enterpriseExpectations,impliedOperatingMargin}=await import('../lib/expectation-engine.ts');
 const View=loadComponent('components/ExpectationMap.tsx','ExpectationMap',{React,useMemo:React.useMemo,useState:React.useState,latestFinancialEvidence,enterpriseExpectations,impliedOperatingMargin,...format,futureFields:[['growth','Annual growth']]});
 const html=renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
 assert.match(html,/What must the business deliver/);assert.match(html,/Complete and reconcile the inputs/);assert.match(html,/These future assumptions are mine/);assert.doesNotMatch(html,/NaN|Infinity|Central assumption sensitivity/);
 const crypto=structuredClone(demoData.research.MSFT);crypto.company.assetType='crypto';assert.match(renderToStaticMarkup(React.createElement(View,{research:crypto})),/does not fit crypto/);
});

test('approved Home keeps account companies, real quotes and missing history separate from illustrative marketing',async()=>{
 const {companyFeedPage,holdingAttention}=await import('../lib/product-attention.ts');
 const {relevantHoldingHeadlines}=await import('../lib/home-feed.ts');
 const quote={price:14.77,currency:'USD',changePct:-.87,asOf:'2026-10-22T20:00:00Z',stale:true};
 const workspace={positions:[{id:'a',symbol:'SOFI',assetType:'stock',currency:'USD',quantity:10,cost:20}],watchlist:[]};
 const Home=loadComponent('components/HomeBriefing.tsx','HomeBriefing',{React,useMemo:React.useMemo,useState:React.useState,useProduct:()=>({workspace,displayName:'Anudeep',workspaceError:''}),useResource:()=>({data:null,error:'History unavailable',loading:false}),companyFeedPage,holdingAttention,relevantHoldingHeadlines,...format,Link:({children,...p})=>React.createElement('a',p,children),SecurityLogo:empty,Notice:({children})=>React.createElement('p',null,children),ArrowUpRight:empty,CalendarDays:empty,ArrowRight:empty,Search:empty});
 const html=renderToStaticMarkup(React.createElement(Home,{quotes:{SOFI:{quote,company:{name:'SoFi Technologies'}}}}));
 assert.match(html,/Anudeep/);assert.match(html,/\$14\.77/);assert.match(html,/Your companies, in focus/);assert.match(html,/Next on your calendar/);assert.match(html,/What changed/);assert.match(html,/temporarily unavailable/);assert.match(html,/Last available/);assert.doesNotMatch(html,/S&amp;P|Example Company|NaN|Infinity|portfolio total/i);
});

test('approved Home renders an honest empty account without fabricated companies or event dates',async()=>{
 const {companyFeedPage,holdingAttention}=await import('../lib/product-attention.ts');
 const {relevantHoldingHeadlines}=await import('../lib/home-feed.ts');
 const Home=loadComponent('components/HomeBriefing.tsx','HomeBriefing',{React,useMemo:React.useMemo,useState:React.useState,useProduct:()=>({workspace:{positions:[],watchlist:[]}}),useResource:()=>({data:null,error:'',loading:false}),companyFeedPage,holdingAttention,relevantHoldingHeadlines,...format,Link:({children,...p})=>React.createElement('a',p,children),SecurityLogo:empty,Notice:empty,ArrowUpRight:empty,CalendarDays:empty,ArrowRight:empty,Search:empty});
 const html=renderToStaticMarkup(React.createElement(Home,{quotes:{}}));assert.match(html,/Find your first company/);assert.doesNotMatch(html,/NOW|HIMS|SOFI|Anudeep|NaN|Infinity/);
});

test('analyst range requires both ordered reported bounds and never manufactures bear/bull valuations',async()=>{
 const {consensusOutlook}=await import('../lib/outlook.ts');
 const r=JSON.parse(fs.readFileSync('tests/fixtures/iren-observed-20261019.json','utf8'));
 r.evidence.consensus={...r.evidence.consensus,target:100,low:50,high:150};
 r.evidence.updatedAt=r.retrievedAt;
 const c=consensusOutlook(r);assert.equal(c.low,50);assert.equal(c.high,150);
 const View=loadComponent('components/AnalystTargets.tsx','AnalystTargets',{React,consensusOutlook,...format});
 const html=renderToStaticMarkup(React.createElement(View,{research:r}));assert.match(html,/\$50\.00/);assert.match(html,/\$150\.00/);assert.match(html,/Reported analyst targets/);assert.match(html,/not calculated bear\/base\/bull/);
 r.evidence.consensus.low=110;const invalid=consensusOutlook(r);assert.equal(invalid.low,undefined);assert.equal(invalid.high,undefined);assert.equal(invalid.target,100);
 delete r.evidence.consensus.low;assert.equal(consensusOutlook(r).low,undefined);
});
