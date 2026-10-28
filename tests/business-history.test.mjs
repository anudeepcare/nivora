import test from "node:test";
import assert from "node:assert/strict";
import {
  businessHistory,
  headerMarketContext,
} from "../lib/business-history.ts";
import { demoData } from "./fixtures/demo.ts";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
const r = demoData.research.MSFT;
test("business history reports denominators, periods and actual cash/profit evidence", () => {
  const x = businessHistory(r);
  assert.ok(x.periods >= 3);
  assert.equal(x.profitYears, x.profitObservations);
  assert.equal(x.cashYears, x.cashObservations);
  assert.ok(x.revenueCagr > 0);
  assert.equal(x.currency, "USD");
});
test("history does not manufacture a moat, dilution or corporate metrics for crypto", () => {
  assert.equal(
    businessHistory({ ...r, company: { ...r.company, assetType: "crypto" } }),
    null,
  );
  const x = businessHistory({
    ...r,
    facts: r.facts.filter((f) => f.metric !== "weightedShares"),
  });
  assert.equal(x.shareChange, null);
  assert.equal(x.moat, null);
});
test("header market cap requires matching quote/listing currency and a positive reported value", () => {
  const s = {
    ...r,
    evidence: {
      ...r.evidence,
      highlights: { ...r.evidence?.highlights, MarketCapitalization: 1e12 },
    },
  };
  assert.equal(headerMarketContext(s).marketCap, 1e12);
  assert.equal(
    headerMarketContext({ ...s, quote: { ...s.quote, currency: "EUR" } })
      .marketCap,
    null,
  );
  assert.equal(
    headerMarketContext({
      ...s,
      evidence: { ...s.evidence, highlights: { MarketCapitalization: NaN } },
    }).marketCap,
    null,
  );
});
test("header withholds a financial-sector label that contradicts a known infrastructure business", () => {
  const x = {
    ...r,
    company: { ...r.company, symbol: "IREN", sector: "Financial Services" },
    evidence: {
      ...r.evidence,
      profile: { sector: "Financial Services", industry: "Data Centers" },
    },
  };
  assert.equal(headerMarketContext(x).sector, null);
});

test("business-history colors separate no observations, zero profitable years, mixed history and all-positive history", () => {
  const ast = ts.createSourceFile(
    "BusinessHistory.tsx",
    fs.readFileSync("components/BusinessHistory.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (x) => ts.isFunctionDeclaration(x) && x.name?.text === "BusinessHistory",
  );
  const code = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const bindings = {
    React,
    useMemo: React.useMemo,
    businessHistory,
    ...format,
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return BusinessHistory;",
  )(...Object.values(bindings));
  for (const [mode, tone] of [
    ["missing", "neutral"],
    ["zero", "red"],
    ["losses", "red"],
    ["mixed", "amber"],
    ["positive", "green"],
  ]) {
    const input = structuredClone(r);
    input.facts = input.facts
      .filter(
        (f) =>
          mode !== "missing" ||
          !["netIncome", "operatingCashFlow", "capex"].includes(f.metric),
      )
      .map((f) => {
        if (!["netIncome", "operatingCashFlow", "capex"].includes(f.metric))
          return f;
        if (mode === "zero") return { ...f, value: 0 };
        if (
          f.metric === "capex" ||
          mode === "positive" ||
          (mode === "mixed" && f.end === "2026-06-30")
        )
          return f;
        return { ...f, value: -Math.abs(f.value) };
      });
    const html = renderToStaticMarkup(
      React.createElement(View, { research: input }),
    );
    assert.equal(
      /<article data-tone="([^"]+)"><span>Profitable years<\/span>/.exec(
        html,
      )?.[1],
      tone,
      mode,
    );
    assert.equal(
      /<article data-tone="([^"]+)"><span>Cash-generating years<\/span>/.exec(
        html,
      )?.[1],
      tone,
      mode,
    );
  }
});
