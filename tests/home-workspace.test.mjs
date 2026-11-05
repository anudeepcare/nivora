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
    SectionIcon: () => null,
    ResearchInbox: () => null,
    OpportunityMap: () => null,
    MarketRadar: () => null,
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
  const file = "components/ApprovedWorkspace.tsx";
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
  const code = ts.transpileModule(declaration.getText(ast), {
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
  assert.deepEqual(radarProps.research, [loaded]);
  assert.equal(radarProps.asOf, marketDay(new Date()));
  assert.match(radarProps.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.doesNotMatch(
    html,
    /aria-label="Portfolio summary"|home-next-step|Compare your next contribution|Featured earnings/,
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

test("Home accumulation panel excludes valuation-only entries without confirmed Pace", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = [];
  r.quote = { ...r.quote, price: 50, asOf: r.retrievedAt, stale: false };
  const signal = workspaceGuidance(r, false, Date.parse(r.retrievedAt));
  assert.equal(signal.action, "Buy");
  assert.equal(signal.view.rawLevel, null);
  const Home = load("HomeOverview", {
    useWorkspaceData: () => ({
      research: () => undefined,
      workspace: { positions: [], watchlist: [{ symbol: "MSFT" }] },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
      pace: () => signal,
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
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.doesNotMatch(html, /confirmed Pending/);
  assert.match(html, /Explore accumulation zones/);
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
  assert.match(pending, /EPS reported.*Pending/);
  assert.match(pending, /Estimate.*0\.00/);
  assert.doesNotMatch(pending, /12\.00/);
});
