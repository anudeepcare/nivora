import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import { groupedLedgerRows } from "../lib/portfolio-ledger.ts";
import { amount, percent, quoteTime } from "../lib/format.ts";

const page = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
const form = fs.readFileSync("components/ApprovedWorkspaceForms.tsx", "utf8");
const route = fs.readFileSync("app/api/workspace/route.ts", "utf8");
test("Holdings renders grouped rows, with full group totals even when a lot matches the filter", () => {
  assert.match(page, /groupedLedgerRows\(allPositions,/);
  assert.match(page, /r\.lots\.some\(\(p\) => selected\.has\(p\.id\)\)/);
  assert.match(page, /key=\{row\.groupKey\}/);
  assert.match(page, /row\.avgCost/);
  assert.match(page, /Mixed currencies/);
});
test("purchase lots are editable individually and adding another pre-fills ticker but never reuses a stored id", () => {
  assert.match(page, /activeHolding\.lots\.map/);
  assert.match(page, /onEdit\(lot\)/);
  assert.match(page, /Add purchase for \$\{p.symbol\}/);
  assert.match(page, /initialSymbol=\{purchaseSeed\?\.symbol\}/);
  assert.match(page, /position=\{editing === "new" \? null : editing\}/);
  assert.match(form, /position\?\.symbol \?\? initialSymbol \?\? ""/);
  assert.match(form, /id: position\?\.id/);
  assert.match(route, /\.insert\(\{ \.\.\.row, user_id: user\.id \}\)/);
});

test("ten purchases render one holding and show all shares and the weighted average", () => {
  const source = page.slice(page.indexOf("function HoldingsTable("));
  const js = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const Empty = () => null;
  const deps = {
    exports: {},
    require(name) {
      assert.equal(name, "react/jsx-runtime");
      return jsx;
    },
    groupedLedgerRows,
    amount,
    percent,
    quoteTime,
    useRef: React.useRef,
    useState: React.useState,
    researchLink: (symbol) => "/research/" + symbol,
    Link: ({ children, ...props }) => React.createElement("a", props, children),
    Wallet: Empty,
    SecurityLogo: Empty,
    PaceBadge: Empty,
    MoreHorizontal: Empty,
    X: Empty,
    Plus: Empty,
    portfolioStyles: { ledger: "ledger" },
    composition: {
      desktopHoldings: "desktopHoldings",
      phoneHoldings: "phoneHoldings",
      phoneLead: "phoneLead",
    },
    reference: { holdingsScroll: "scroll", purchaseLots: "purchaseLots" },
  };
  const Component = new Function(
    ...Object.keys(deps),
    js + "\nreturn HoldingsTable;",
  )(...Object.values(deps));
  const lots = Array.from({ length: 10 }, (_, index) => ({
    id: String(index),
    symbol: "APP",
    assetType: "stock",
    quantity: index + 1,
    cost: index + 10,
    currency: "USD",
  }));
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      positions: [lots[0]],
      allPositions: lots,
      state: {
        model: { invested: 1100 },
        q: { APP: { price: 20, currency: "USD" } },
        quotes: { data: { APP: { quote: { price: 20, currency: "USD" } } } },
        prefix: "",
        pace: () => null,
        paceScan: { loading: false },
      },
      earnings: new Set(),
      onEdit() {},
      onAddPurchase() {},
    }),
  );
  assert.equal(
    (html.match(/<tr>/g) ?? []).length,
    2,
    "one header and one holding row",
  );
  assert.match(html, /10 purchases/);
  assert.match(html, /55 shares/);
  assert.match(html, /\$16\.00 avg cost/);
  assert.match(html, /Manage APP purchases/);
  const phone =
    html.match(
      /<ul[^>]+aria-label="Portfolio holdings"[^>]*>[\s\S]*?<\/ul>/,
    )?.[0] ?? "";
  assert.equal(
    (phone.match(/<li>/g) ?? []).length,
    1,
    "one company summary despite ten purchases",
  );
  const [lead, details] = phone.split("<details");
  assert.match(lead, /APP/);
  assert.match(lead, /\$1,100/);
  assert.match(lead, /\$220/);
  assert.doesNotMatch(
    lead,
    /Quoted price|Weight|Average cost|Manage purchases/,
  );
  assert.match(details, /Quoted price/);
  assert.match(details, /Average cost/);
  assert.match(details, /Manage APP purchases/);
  assert.match(details, /Add purchase for APP/);
});
