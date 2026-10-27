import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  bindings = { PaceHelp: () => null, ...bindings };
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
  let requested;
  const Home = load("HomeOverview", {
    useWorkspaceData: () => ({
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
  assert.doesNotMatch(html, /aria-label="Portfolio summary"/);
});
