import { loadHomeNews } from "./helpers/home-news-ui.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { workspaceGuidance } from "../lib/edge-research.ts";
import { demoData } from "./fixtures/demo.ts";
import * as format from "../lib/format.ts";
import { homeBrief } from "../lib/home-brief.ts";
import {
  groupMarketEvents,
  marketDay,
  earningsEventState,
  homeFeedReadiness,
  relevantHoldingHeadlines,
} from "../lib/home-feed.ts";
const empty = () => null;
const Link = ({ children, ...props }) =>
  React.createElement("a", props, children);
function load(name, bindings) {
  bindings = {
    useState: React.useState,
    HomeNewsFeed: loadHomeNews(),
    SectionIcon: () => null,
    PaceBoard: () => React.createElement("section", {"aria-label":"Accumulation opportunities"}),
    ResearchInbox: () => null,
    ContributionCompare: () => React.createElement("section", {"aria-label":"Compare your next contribution"}, "Compare companies"),
    HomeMarketCards: () => null,
    HomeDailyBriefing: () => null,
    OpportunityMap: () => null,
    MarketRadar: () => null,
    PortfolioDay: () => null,
    SearchIcon: () => null,
    ...bindings,
  };
  bindings = {
    homeStyles: { home: "home" },
    Search: () =>
      React.createElement("input", { "aria-label": "Company search" }),
    ResearchLens: () => React.createElement("aside", null, "Research lens"),
    ...bindings,
  };
  bindings = { PaceHelp: () => null, ...bindings };
  if (name === "HomeOverview")
    bindings.EarningsNumbers = load("EarningsNumbers", {});
  const file = name === "PaceBoard" ? "components/WorkspacePace.tsx" : name === "ResearchHome" ? "components/ResearchHomePage.tsx" : "components/HomeWorkspace.tsx";
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
  const code = ts.transpileModule(declaration.getText(ast).replace(/^export /, ""), {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return new Function(
    "React",
    ...Object.keys(bindings),
    `${code};return ${name};`,
  )(React, ...Object.values(bindings));
}
test("Home company rows always show when their displayed quote was observed", () => {
  const HomeCompany = load("HomeCompany", {
    Link,
    SecurityLogo: empty,
    CompanySparkline: empty,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
  });
  const html = renderToStaticMarkup(
    React.createElement(HomeCompany, {
      symbol: "NOW",
      prefix: "",
      row: {
        company: { name: "ServiceNow" },
        quote: {
          price: 100,
          changePct: 5,
          currency: "USD",
          asOf: "2020-01-03T21:00:00Z",
        },
      },
    }),
  );
  assert.match(html, /datetime="2020-01-03T21:00:00Z"/i);
  assert.match(html, /2020/);
});

test("Watchlist-only Home avoids an irrelevant zero-value portfolio summary", () => {
  const symbols = Array.from({ length: 34 }, (_, index) => `STK${index}`);
  let requested, radarProps;
  const loaded = { company: { symbol: symbols[0] } };
  const Home = load("HomeOverview", {
    useState: () => [true, () => {}],
    MarketRadar: (props) => {
      radarProps = props;
      return null;
    },
    useWorkspaceData: () => ({
      research: (symbol) => (symbol === symbols[0] ? loaded : undefined),
      workspace: {
        positions: [],
        watchlist: symbols.map((symbol) => ({ symbol })),
      },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
      pace: () => null,
    }),
    useHomeFeed: (stocks) => {
      requested = stocks;
      return {
        data: {
          events: [],
          news: [],
          issues: [],
          followed: 34,
          newsFollowed: 34,
          retrievedAt: "",
          eventsReady: true,
          newsReady: true,
        },
        loading: false,
        error: "",
        refresh: empty,
      };
    },
    homeFeedReadiness,
    homeBrief,
    groupMarketEvents,
    marketDay,
    earningsEventState,
    relevantHoldingHeadlines,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
    Link,
    Heading: empty,
    SectionHead: empty,
    Coverage: empty,
    Notice: empty,
    WealthStrip: () =>
      React.createElement(
        "section",
        { "aria-label": "Portfolio summary" },
        "$0",
      ),
    HomeCompany: empty,
    Empty: empty,
    ArrowUpRight: empty,
    CalendarDays: empty,
    FileText: empty,
    RefreshCw: empty,
    Wallet: empty,
    Bookmark: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.deepEqual(requested, symbols);
  assert.doesNotMatch(html,/Compare your next contribution/);
  assert.deepEqual(radarProps.research, [loaded]);
  assert.equal(radarProps.asOf, marketDay(new Date()));
  assert.match(radarProps.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.doesNotMatch(
    html,
    /aria-label="Portfolio summary"|home-next-step|Featured earnings/,
  );
});

test("New account Home has research tools without empty personal feeds", () => {
  const symbols = [];
  let requested;
  const Home = load("HomeOverview", {
    useWorkspaceData: () => ({
      research: () => undefined,
      workspace: {
        positions: [],
        watchlist: symbols.map((symbol) => ({ symbol })),
      },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
      pace: () => null,
    }),
    useHomeFeed: (stocks) => {
      requested = stocks;
      return {
        data: {
          events: [],
          news: [],
          issues: [],
          followed: 34,
          newsFollowed: 34,
          retrievedAt: "",
          eventsReady: true,
          newsReady: true,
        },
        loading: false,
        error: "",
        refresh: empty,
      };
    },
    homeFeedReadiness,
    homeBrief,
    groupMarketEvents,
    marketDay,
    earningsEventState,
    relevantHoldingHeadlines,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
    Link,
    Heading: empty,
    SectionHead: empty,
    Coverage: empty,
    Notice: empty,
    WealthStrip: () =>
      React.createElement(
        "section",
        { "aria-label": "Portfolio summary" },
        "$0",
      ),
    HomeCompany: empty,
    Empty: empty,
    ArrowUpRight: empty,
    CalendarDays: empty,
    FileText: empty,
    RefreshCw: empty,
    Wallet: empty,
    Bookmark: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.deepEqual(requested, symbols);
  assert.doesNotMatch(
    html,
    /aria-label="Portfolio summary"|Company earnings and events|What changed/,
  );
  assert.match(html, /Research a company/);
});

test("Home defers research scans and never presents an unconfirmed valuation-only signal as Pace", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = [];
  r.quote = { ...r.quote, price: 50, asOf: r.retrievedAt, stale: false };
  const signal = workspaceGuidance(r, false, Date.parse(r.retrievedAt));
  assert.equal(signal.action, "Buy");
  assert.equal(signal.view.rawLevel, null);
  const state = [];
  let cursor = 0;
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], (value) => { state[index] = value; }];
  };
  const PaceBoard = load("PaceBoard", { s: {}, Link, researchLink: (symbol) => "/research/" + symbol, ...format });
  const rows = { MSFT: { signal } };
  const Home = load("HomeOverview", {
    useState,
    PaceBoard,
    useWorkspaceData: () => ({
      research: () => undefined,
      workspace: { positions: [], watchlist: [{ symbol: "MSFT" }] },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
      pace: () => signal,
      paceScan: { rows, loading: false, refresh: empty },
    }),
    useHomeFeed: () => ({
      data: {
        events: [],
        news: [],
        issues: [],
        followed: 1,
        newsFollowed: 1,
        retrievedAt: "",
        eventsReady: true,
        newsReady: true,
      },
      loading: false,
      error: "",
      refresh: empty,
    }),
    homeFeedReadiness,
    homeBrief,
    groupMarketEvents,
    marketDay,
    earningsEventState,
    relevantHoldingHeadlines,
    researchLink: (symbol) => "/research/" + symbol,
    ...format,
    Link,
    Heading: empty,
    SectionHead: empty,
    Coverage: empty,
    Notice: empty,
    WealthStrip: empty,
    HomeCompany: empty,
    Empty: empty,
    ArrowUpRight: empty,
    CalendarDays: empty,
    FileText: empty,
    RefreshCw: empty,
    Wallet: empty,
    Bookmark: empty,
    Activity: empty,
  });
  const render = () => { cursor = 0; return Home(); };
  const find = (node, predicate) => {
    if (!React.isValidElement(node)) return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return null;
  };
  let tree = render();
  assert.equal(find(tree, node => node.type === PaceBoard), null, "Pace board is deferred");
  const desk = find(tree, node => node.props.id === "home-workbench");
  desk.props.onToggle({ currentTarget: { open: true } });
  tree = render();
  assert.ok(find(tree, node => node.type === PaceBoard), "Opening desk mounts real Pace board");
  let html = renderToStaticMarkup(tree);
  assert.match(html, /No confirmed accumulation opportunities/);
  assert.doesNotMatch(html, /View MSFT evidence/);
  rows.CONFIRMED = { signal: {
    view: { rawLevel: 3, permitted: true, actionLabel: "Add gradually · P3", code: "P3" },
    periods: [{ key: "confirmed", date: "2026-10-30", level: 3 }],
  } };
  html = renderToStaticMarkup(render());
  assert.match(html, /View CONFIRMED evidence/);
  assert.match(html, /2026-10-30/);
  assert.match(html, /Add gradually/);
  assert.doesNotMatch(html, /View MSFT evidence/);
});

test("Home earnings preserves zero and negative actuals, estimates and pending releases", () => {
  const EarningsNumbers = load("EarningsNumbers", {});
  for (const actual of [0, -0.25, 2.5]) {
    const html = renderToStaticMarkup(
      React.createElement(EarningsNumbers, {
        event: {
          symbol: "TEST",
          kind: "Earnings",
          date: "2026-11-04",
          actual,
          estimate: 0.3,
        },
        today: "2026-11-05",
      }),
    );
    assert.ok(html.includes(actual.toFixed(2)));
    assert.match(html, /Estimate.*0\.30/);
  }
  const pending = renderToStaticMarkup(
    React.createElement(EarningsNumbers, {
      event: {
        symbol: "TEST",
        kind: "Earnings",
        date: "2026-11-06",
        actual: 12,
        estimate: 0,
      },
      today: "2026-11-05",
    }),
  );
  assert.doesNotMatch(pending, /EPS reported|Pending/);
  assert.match(pending, /Estimate.*0\.00/);
  assert.doesNotMatch(pending, /12\.00/);
});


test("Research chart pages keep every saved company reachable with four bounded charts and clamp after deletions", () => {
  const symbols = Array.from({length: 9}, (_, i) => `STK${i}`);
  for (const [page, expected, previousDisabled, nextDisabled] of [
    [0, symbols.slice(0,4), true, false],
    [1, symbols.slice(4,8), false, false],
    [99, symbols.slice(8), false, true],
  ]) {
    let cards;
    const View = load("ResearchHome", {
      exports: {},
      useProduct: () => ({workspace:{watchlist:symbols.map(symbol=>({symbol})),positions:[]}}),
      useWorkspaceQuotes: () => ({data:{},error:""}),
      useState: () => [page,()=>{}],
      HomeMarketCards: props => { cards=props; return React.createElement("section",null,props.symbols.join(",")); },
      Heading: empty, Notice: empty, Empty:empty,
      homeStyles:{research:"research",researchPaging:"paging"},
    });
    const html=renderToStaticMarkup(React.createElement(View));
    assert.deepEqual(cards.symbols,expected);
    assert.equal(cards.total,9);
    assert.equal(cards.context,"research");
    assert.equal(cards.prefix,"");
    assert.equal(/<button[^>]*disabled=""[^>]*>Previous/.test(html),previousDisabled);
    assert.equal(/<button[^>]*disabled=""[^>]*>Next/.test(html),nextDisabled);
  }
});

test("Home headlines use a bounded pager with consistent metadata", () => {
  const news = Array.from({ length: 9 }, (_, i) => ({
    symbol: "MSFT", date: new Date(Date.now() - 3600000).toISOString(),
    title: `Company update ${i}`, url: `https://example.com/story/${i}`,
  }));
  const Home = load("HomeOverview", {
    useWorkspaceData: () => ({ research: () => undefined,
      workspace: { positions: [], watchlist: [{ symbol: "MSFT" }] },
      quotes: { data: {} }, model: { allocations: [] }, prefix: "", pace: () => null }),
    useHomeFeed: () => ({ data: { news, events: [], issues: [], followed: 1,
      newsFollowed: 1, retrievedAt: new Date().toISOString(), eventsReady: true, newsReady: true },
      loading: false, error: "", refresh: empty }),
    homeFeedReadiness, homeBrief, groupMarketEvents, marketDay, earningsEventState,
    relevantHoldingHeadlines: (items) => items,
    researchLink: (symbol) => `/research/${symbol}`, ...format, Link,
    SecurityLogo: ({ symbol }) => React.createElement("i", { "data-logo": symbol }),
    Heading: empty, SectionHead: empty, Coverage: empty, Notice: empty,
    HomeCompany: empty, Empty: empty, ArrowUpRight: empty, CalendarDays: empty,
    FileText: empty, RefreshCw: empty, Bookmark: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  if (process.env.AURYN_HOME_NEWS_FIXTURE) fs.writeFileSync(process.env.AURYN_HOME_NEWS_FIXTURE, html);
  assert.equal((html.match(/data-logo="MSFT"/g) || []).length, 4);
  assert.equal((html.match(/<time /g) || []).length, 4);
  assert.match(html, /1–4 of 9/);
  assert.match(html, /aria-label="Next headlines"/);
  assert.doesNotMatch(html, /home-more-updates/);
});
