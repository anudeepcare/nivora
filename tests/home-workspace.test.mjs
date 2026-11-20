import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
import { quoteHealth } from "../lib/quote-health.ts";
import { watchMarketDay } from "../lib/today-market-clock.ts";
import { todayNarrative } from "../lib/today-narrative.ts";
import { dailyPerspective, homeBrief } from "../lib/home-brief.ts";
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
    useEffect: React.useEffect,
    useState: React.useState,
    watchMarketDay,
    Lightbulb: empty,
    useResource: () => ({ data: null, loading: false }),
    quoteHealth,
    todayNarrative,
    dailyPerspective,
    useAccess: () => ({
      access: { admitted: true, features: { news: false } },
    }),
    TodayMacroWatch: () => null,
    SectionIcon: () => null,
    ResearchInbox: () => null,
    ContributionCompare: () =>
      React.createElement(
        "section",
        { "aria-label": "Compare your next contribution" },
        "Compare companies",
      ),
    HomeMarketCards: () => null,
    HomeQuarterHighlights: () => null,
    OpportunityMap: () => null,
    HomeRadar: () => null,
    PortfolioDay: () => null,
    SearchIcon: () => null,
    ...bindings,
  };
  bindings = {
    homeStyles: { home: "home" },
    todayStyles: { hero: "hero" },
    cockpit: { library: "library" },
    styles: new Proxy({}, { get: (_, k) => k }),
    Link,
    ArrowUpRight: () => null,
    Search: () =>
      React.createElement("input", { "aria-label": "Company search" }),
    ResearchLens: () => React.createElement("aside", null, "Research lens"),
    ...bindings,
  };
  bindings = { PaceHelp: () => null, ...bindings };
  if (name === "HomeOverview") {
    bindings.EarningsNumbers = load("EarningsNumbers", {});
  }
  const file =
    name === "TodaySequence"
      ? "components/TodaySequence.tsx"
      : name === "ResearchHome"
        ? "components/ResearchHomePage.tsx"
        : "components/HomeWorkspace.tsx";
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
    declaration.getText(ast).replace(/^export default /, ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
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
    HomeRadar: (props) => {
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
  assert.match(html, /Compare your next contribution/);
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
  assert.doesNotMatch(html, /Research a company|Begin with the evidence/);
  assert.match(html, /Build this month’s research plan/);
});

test("Home does not scan or present a second Pace workspace", () => {
  let scope;
  let options;
  const Home = load("HomeOverview", {
    useWorkspaceData: (scopeArg, optionsArg) => {
      scope = scopeArg;
      options = optionsArg;
      return {
        research: () => undefined,
        workspace: { positions: [], watchlist: [{ symbol: "MSFT" }] },
        quotes: { data: {} },
        model: { allocations: [] },
        prefix: "",
      };
    },
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
  assert.equal(scope, "all");
  assert.deepEqual(options, { scanPace: false });
  assert.doesNotMatch(
    html,
    /Accumulation opportunities|Refresh Pace|Research question/,
  );
  assert.match(html, /<aside[^>]*aria-label="Auryn thought"/);
  assert.match(html, /Market radar/);
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=""|>)/);
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
  const symbols = Array.from({ length: 9 }, (_, i) => `STK${i}`);
  for (const [page, expected, previousDisabled, nextDisabled] of [
    [0, symbols.slice(0, 4), true, false],
    [1, symbols.slice(4, 8), false, false],
    [99, symbols.slice(8), false, true],
  ]) {
    let cards;
    const View = load("ResearchHome", {
      exports: {},
      useProduct: () => ({
        workspace: {
          watchlist: symbols.map((symbol) => ({ symbol })),
          positions: [],
        },
      }),
      useWorkspaceQuotes: () => ({ data: {}, error: "" }),
      useState: () => [page, () => {}],
      HomeMarketCards: (props) => {
        cards = props;
        return React.createElement("section", null, props.symbols.join(","));
      },
      Heading: empty,
      Notice: empty,
      Empty: empty,
      homeStyles: { research: "research", researchPaging: "paging" },
    });
    const html = renderToStaticMarkup(React.createElement(View));
    assert.deepEqual(cards.symbols, expected);
    assert.equal(cards.total, 9);
    assert.equal(cards.context, "research");
    assert.equal(cards.prefix, "");
    assert.equal(
      /<button[^>]*disabled=""[^>]*>Previous/.test(html),
      previousDisabled,
    );
    assert.equal(/<button[^>]*disabled=""[^>]*>Next/.test(html), nextDisabled);
  }
});

test("expanded Home headlines retain the same logo, timestamp and article layout", () => {
  const news = Array.from({ length: 9 }, (_, i) => ({
    symbol: "MSFT",
    date: new Date(Date.now() - 3600000).toISOString(),
    title: i === 0 ? "Microsoft files its 10-Q" : `Company update ${i}`,
    url: `https://example.com/story/${i}`,
  }));
  const Home = load("HomeOverview", {
    useWorkspaceData: () => ({
      research: () => undefined,
      workspace: { positions: [], watchlist: [{ symbol: "MSFT" }] },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
      pace: () => null,
    }),
    useHomeFeed: () => ({
      data: {
        news,
        events: [],
        issues: [],
        followed: 1,
        newsFollowed: 1,
        retrievedAt: new Date().toISOString(),
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
    relevantHoldingHeadlines: (items) => items,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
    Link,
    SecurityLogo: ({ symbol }) =>
      React.createElement("i", { "data-logo": symbol }),
    Heading: empty,
    SectionHead: empty,
    Coverage: empty,
    Notice: empty,
    HomeCompany: empty,
    Empty: empty,
    ArrowUpRight: empty,
    CalendarDays: empty,
    FileText: empty,
    RefreshCw: empty,
    Bookmark: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  if (process.env.AURYN_HOME_NEWS_FIXTURE)
    fs.writeFileSync(process.env.AURYN_HOME_NEWS_FIXTURE, html);
  const expanded = html.slice(html.indexOf('class="home-more-updates"'));
  assert.match(expanded, /class="home-news-list"/);
  assert.equal((expanded.match(/class="home-news-meta"/g) || []).length, 2);
  assert.equal((expanded.match(/class="home-news-title"/g) || []).length, 2);
  assert.equal((expanded.match(/data-logo="MSFT"/g) || []).length, 2);
  assert.equal((expanded.match(/<time /g) || []).length, 2);
  assert.equal((html.match(/class="home-news-title"/g) || []).length, 8);
  assert.equal(
    (html.match(/https:\/\/example\.com\/story\/0"/g) || []).length,
    1,
  );
  assert.match(
    html,
    /aria-label="Today’s story"[\s\S]*href="https:\/\/example\.com\/story\/0"/,
  );
});

test("daily briefing reuses followed benchmarks, labels the reported session and withholds future prices", () => {
  const requests = [];
  const quote = (changePct, asOf) => ({
    price: 400,
    changePct,
    asOf,
    currency: "USD",
    session: "Closed",
    source: "Fixture",
    stale: true,
  });
  const Home = load("HomeOverview", {
    useResource(key) {
      requests.push(key);
      return { data: { QQQ: { quote: quote(-5, "2099-01-01") } } };
    },
    useWorkspaceData: () => ({
      research: empty,
      workspace: { positions: [], watchlist: [{ symbol: "SPY" }] },
      quotes: { data: { SPY: { quote: quote(1.55, "2026-11-18") } } },
      model: { allocations: [] },
      prefix: "",
      pace: empty,
    }),
    useHomeFeed: () => ({ data: null, loading: false, error: "" }),
    homeBrief,
    homeFeedReadiness,
    groupMarketEvents,
    marketDay,
    earningsEventState,
    relevantHoldingHeadlines,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
    Heading: empty,
    SectionHead: empty,
    Coverage: empty,
    Notice: empty,
    RefreshCw: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.deepEqual(requests, ["quotes?symbols=QQQ", null]);
  assert.match(html, /SPY<\/a>[\s\S]*data-direction="up">\+1.6%/);
  assert.match(
    html,
    /data-freshness="older">Older quote<\/span><span>Closed<\/span><time dateTime="2026-11-18"/,
  );
  assert.match(html, /QQQ<\/a>[\s\S]*Quote unavailable/);
  assert.doesNotMatch(html, /2099|-5\.0%/);
  assert.match(html, new RegExp(`<time dateTime="${marketDay(new Date())}"`));
  assert.match(html, /href="\/research">Open company research/);
});

test("new users get scoped market context while preview or unentitled sessions never request it", () => {
  for (const [admitted, news, sampleOnly, enabled] of [
    [true, true, false, true],
    [true, false, false, false],
    [true, true, true, false],
    [false, true, false, false],
  ]) {
    const queries = [];
    const Home = load("HomeOverview", {
      useAccess: () => ({
        access: { admitted, sampleOnly, features: { news } },
      }),
      useResource: (key) => {
        queries.push(key);
        return {
          data: {
            items: [
              {
                date: new Date(Date.now() - 60_000).toISOString(),
                title:
                  "U.S. inflation data put Federal Reserve decision in focus",
                url: "https://example.com/macro",
              },
            ],
          },
        };
      },
      useWorkspaceData: () => ({
        research: empty,
        workspace: { positions: [], watchlist: [] },
        quotes: { data: {} },
        model: { allocations: [] },
        prefix: "",
      }),
      useHomeFeed: () => ({ data: null, loading: false, error: "" }),
      homeBrief,
      homeFeedReadiness,
      groupMarketEvents,
      marketDay,
      earningsEventState,
      relevantHoldingHeadlines,
      researchLink: (symbol) => `/research/${symbol}`,
      ...format,
      Heading: empty,
      SectionHead: empty,
      Coverage: empty,
      Notice: empty,
    });
    const html = renderToStaticMarkup(React.createElement(Home));
    assert.equal(
      queries.filter((key) => key === "news?symbol=SPY").length,
      enabled ? 1 : 0,
    );
    if (enabled) {
      assert.match(html, /SPY market coverage · Source headline/);
      assert.match(html, /href="https:\/\/example\.com\/macro"/);
      assert.doesNotMatch(html, /Next supplied event|Scheduled today/);
    } else {
      assert.match(html, /Start with what you can verify/);
      assert.doesNotMatch(html, /example\.com\/macro/);
    }
  }
});

test("a followed lead renders while market coverage loads and competes once a fresher broad report is available", () => {
  let marketReady = false;
  const requests = [];
  const now = Date.now();
  const company = {
    symbol: "NBIS",
    date: new Date(now - 30 * 3_600_000).toISOString(),
    title: "Nebius cuts 2026 outlook",
    url: "https://example.com/nbis-outlook",
  };
  const market = {
    date: new Date(now - 60_000).toISOString(),
    title: "New Federal Reserve minutes as inflation data arrive",
    url: "https://example.com/market-report",
  };
  const Home = load("HomeOverview", {
    useAccess: () => ({ access: { admitted: true, features: { news: true } } }),
    useResource(key) {
      requests.push(key);
      return key === "news?symbol=SPY"
        ? {
            data: marketReady ? { items: [market] } : null,
            loading: !marketReady,
          }
        : { data: null, loading: false };
    },
    useWorkspaceData: () => ({
      research: empty,
      workspace: { positions: [], watchlist: [{ symbol: "NBIS" }] },
      quotes: { data: {} },
      model: { allocations: [] },
      prefix: "",
    }),
    useHomeFeed: () => ({
      data: {
        news: [company],
        events: [],
        followed: 1,
        newsFollowed: 1,
        issues: [],
      },
      loading: true,
      error: "",
      refresh: empty,
    }),
    relevantHoldingHeadlines: (items) => items,
    homeBrief,
    homeFeedReadiness,
    groupMarketEvents,
    marketDay,
    earningsEventState,
    researchLink: (symbol) => `/research/${symbol}`,
    ...format,
    SectionHead: empty,
    SecurityLogo: empty,
    RefreshCw: empty,
    Coverage: empty,
    Notice: empty,
  });
  const lead = (html) =>
    html.match(/aria-label="Today’s story"[\s\S]*?<\/section>/)?.[0];
  const first = renderToStaticMarkup(React.createElement(Home));
  assert.ok(requests.includes("news?symbol=SPY"));
  assert.match(lead(first), /NBIS · Source headline/);
  assert.match(lead(first), /nbis-outlook/);
  assert.doesNotMatch(lead(first), /Checking for dated/);
  marketReady = true;
  const settled = renderToStaticMarkup(React.createElement(Home));
  assert.match(lead(settled), /SPY market coverage · Source headline/);
  assert.doesNotMatch(lead(settled), /nbis-outlook/);
  assert.equal(
    (settled.match(/href="https:\/\/example\.com\/nbis-outlook"/g) ?? [])
      .length,
    1,
  );
});
