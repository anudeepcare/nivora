import test from "node:test";
import assert from "node:assert/strict";
import { valuationInputs, perspective } from "../lib/analysis.ts";
import { canonical } from "../lib/canonical.ts";
import {
  estimateValue,
  earningsMultiple,
  upcomingEstimates,
} from "../lib/evidence-display.ts";
import { accountCache, clearAccountCache } from "../lib/account-cache.ts";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { workspaceSymbolBatches } from "../lib/workspace.ts";
import { dateLabel } from "../lib/format.ts";

function component(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const node = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const code = ts.transpileModule(
    node.getText(ast).replace("export default ", "").replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}

function research() {
  const facts = [];
  function period(scope, start, end, fcf, revenue) {
    for (const [metric, value] of Object.entries({
      operatingCashFlow: fcf + 10,
      capex: 10,
      revenue,
      netIncome: 20,
    }))
      facts.push({
        id: metric + end,
        metric,
        value,
        scope,
        start,
        end,
        filed: end,
        currency: "USD",
        unit: "USD",
        basis: "GAAP",
        accession: end,
        sourceUrl: "https://example.com/filing",
        form: "10-K",
      });
  }
  period("annual", "2025-01-01", "2025-12-31", 74, 1000);
  for (const [start, end] of [
    ["2025-07-01", "2025-09-30"],
    ["2025-10-01", "2025-12-31"],
    ["2026-01-01", "2026-03-31"],
    ["2026-04-01", "2026-06-30"],
  ])
    period("quarterly", start, end, 30, 300);
  facts.push({
    id: "shares",
    metric: "shares",
    value: 100,
    scope: "instant",
    end: "2026-06-30",
    filed: "2026-08-01",
    currency: null,
    unit: "shares",
    basis: "GAAP",
    accession: "shares",
    sourceUrl: "https://example.com/filing",
    form: "10-Q",
  });
  return {
    company: {
      symbol: "HIMS",
      name: "Hims",
      assetType: "stock",
      currency: "USD",
    },
    quote: { price: 28.07, currency: "USD", stale: false },
    facts,
    history: [],
    filings: [],
    issues: [],
    retrievedAt: "2026-10-17T00:00:00Z",
  };
}
test("cash flow uses the more recent complete TTM period, not last year by default", () => {
  const v = valuationInputs(research());
  assert.equal(v.latest.end, "2026-06-30");
  assert.equal(v.latest.fcf, 120);
  assert.equal(v.periodBasis, "TTM");
});
test("generic calculator assumptions cannot decide whether a stock is cheap or expensive", () => {
  const r = research();
  assert.equal(perspective(r).valuation, "Assumption dependent");
  for (const price of [0.01, 28.07, 10000]) {
    const snapshot = canonical({ ...r, quote: { ...r.quote, price } });
    assert.equal(snapshot.newCapital, "Research candidate");
    assert.doesNotMatch(snapshot.valuation, /Above base|Below base/);
  }
});
test("a profitable prior year cannot override losses in the latest complete TTM evidence", () => {
  const r = research();
  r.facts = r.facts.map((f) =>
    f.scope === "quarterly" && f.metric === "netIncome"
      ? { ...f, value: -20 }
      : f,
  );
  assert.equal(perspective(r).business, "Loss-making");
  assert.equal(canonical(r).newCapital, "Review business economics");
  assert.equal(canonical(r).financialPeriod, "2026-06-30");
});
test("a zero or negative P/E is not displayed as a cheap positive multiple", () => {
  assert.equal(earningsMultiple(0), "N/M");
  assert.equal(earningsMultiple(-3), "N/M");
  assert.equal(earningsMultiple(null), "—");
  assert.equal(earningsMultiple(73.5), "73.5×");
});
test("estimates with no stated currency retain numbers without inventing USD", () => {
  assert.equal(estimateValue(6800000000, null, true), "6.8B");
  assert.equal(estimateValue(3.21, null), "3.21");
  assert.equal(estimateValue(null, null), "—");
  assert.equal(estimateValue(3.21, "USD"), "$3.21");
});
test("navigation reuses account data but account switches and sign-out invalidate it", () => {
  clearAccountCache();
  const first = accountCache("alice");
  first.set("workspace", { at: Date.now(), value: { private: "alice" } });
  assert.equal(accountCache("alice"), first);
  assert.equal(accountCache("bob").has("workspace"), false);
  assert.equal(first.size, 0);
  assert.equal(accountCache("alice").has("workspace"), false);
  clearAccountCache();
  assert.equal(accountCache("alice").size, 0);
});
test("forecast table renders available estimates, including an unreported completed quarter", () => {
  const r = research();
  const estimate = {
    frequency: "quarterly",
    date: "2026-09-30",
    period: "0q",
    currency: null,
    revenue: 6800000000,
    eps: 3.21,
    epsLow: 3,
    epsHigh: 4,
    analysts: 12,
  };
  r.evidence = {
    updatedAt: "2026-10-17",
    estimates: [{ ...estimate, date: "2024-06-30" }, estimate],
  };
  const Forecasts = component("components/ResearchEvidence.tsx", "Forecasts", {
    React,
    useState: () => [false, () => {}],
    upcomingEstimates,
    estimateValue,
    dateLabel,
  });
  const html = renderToStaticMarkup(
    React.createElement(Forecasts, { research: r }),
  );
  assert.match(html, /6.8B/);
  assert.match(html, /3.21/);
  assert.doesNotMatch(html, /\$3.21/);
  assert.match(html, /Sep 30, 2026/);
  assert.doesNotMatch(html, /2024/);
});
test("workspace quote refresh commits all batches together and settles loading", async () => {
  const symbols = Array.from(
    { length: 12 },
    (_, i) => `STOCK${String.fromCharCode(65 + i)}`,
  );
  const state = [],
    effects = [],
    requests = [];
  let index = 0;
  const cache = new Map();
  const hook = component("components/Workspace.tsx", "useWorkspaceQuotes", {
    useProduct: () => ({
      workspace: {
        positions: symbols.map((symbol) => ({ symbol, assetType: "stock" })),
        watchlist: [],
      },
      cache,
      marketProvider: "eodhd",
    }),
    workspaceSymbolBatches,
    useState: (initial) => {
      const i = index++;
      state[i] = typeof initial === "function" ? initial() : initial;
      return [
        state[i],
        (v) => {
          state[i] = typeof v === "function" ? v(state[i]) : v;
        },
      ];
    },
    useCallback: (f) => f,
    useMemo: (f) => f(),
    useLivePrices: () => ({ticks:{},connected:false}),
    mergePriceTick: (base) => base,
    quoteHealth: (base) => base,
    useRef: (value) => ({current:value}),
    useEffect: (f) => effects.push(f),
    api: async (path) => {
      requests.push(path);
      const selected = decodeURIComponent(path.split("=")[1]).split(",");
      return Object.fromEntries(
        selected.map((symbol) => [
          symbol,
          { quote: { price: 10, currency: "USD", stale: false } },
        ]),
      );
    },
  });
  hook("portfolio");
  const cleanup = effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.equal(Object.keys(state[1]).length, 12);
  assert.equal(state[2], false);
  assert.equal(state[3], true);
  cleanup();
});
