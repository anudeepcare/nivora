import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { overviewValueMessage } from "../lib/evidence-graphics.ts";
import { researchEdge } from "../lib/edge-research.ts";
import { latestFinancialEvidence } from "../lib/analysis.ts";
import * as format from "../lib/format.ts";
import { demoData } from "./fixtures/demo.ts";
function view(edgeOverride) {
  const source = fs.readFileSync("components/EdgeOverview.tsx", "utf8");
  const ast = ts.createSourceFile(
    "EdgeOverview.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (x) => ts.isFunctionDeclaration(x) && x.name?.text === "EdgeOverview",
  );
  const code = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const bindings = {
    ArrowUpRight: icons.ArrowUpRight,
    ShieldCheck: icons.ShieldCheck,
    TriangleAlert: icons.TriangleAlert,
    Sprout: icons.Sprout,
    ChartNoAxesCombined: icons.ChartNoAxesCombined,
    BookOpen: icons.BookOpen,
    CalendarDays: icons.CalendarDays,
    overviewValueMessage,
    EvidenceSeries: () => null,
    RsiGraphic: () => null,
    useProduct: () => ({ workspace: null }),
    React,
    useMemo: React.useMemo,
    researchEdge: edgeOverride ?? researchEdge,
    latestFinancialEvidence,
    ...format,
    Help: ({ trigger }) => React.createElement("button", null, trigger),
    CaseRange: ({ currency }) =>
      React.createElement(
        "div",
        { "data-scale-currency": currency },
        "Shared scale",
      ),
    PriceRiskCases: () => React.createElement("div", null, "Historical risk"),
    AnalystTargets: () => null,
  };
  return new Function(...Object.keys(bindings), code + ";return EdgeOverview;")(
    ...Object.values(bindings),
  );
}
test("Edge overview renders decision, concrete evidence and separate confirmed/forming Pace without invalid values", () => {
  const Component = view();
  for (const r of Object.values(demoData.research)) {
    const html = renderToStaticMarkup(
      React.createElement(Component, {
        research: r,
        onTab: () => {},
        chart: React.createElement("div", null, "Price chart"),
      }),
    );
    assert.match(html, /AURYN VIEW/);
    assert.match(html, /AURYN PACE/);
    assert.match(html, /Completed monthly/);
    assert.match(html, /Cash conversion/);
    assert.doesNotMatch(html, /NaN|Infinity|Revenue by business/);
  }
});
test("Edge reading never labels unreconciled fundamentals a build opportunity", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = {
    ...r.evidence,
    reportingCurrency: r.quote.currency,
    ownership: { outstanding: 1 },
    highlights: { MarketCapitalization: 1e15 },
  };
  const reading = researchEdge(r);
  assert.equal(reading.verdict, "Evidence needed");
  assert.equal(reading.pace, reading.pricePace);
});
test("banks do not inherit an operating-company cash-flow verdict", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.company.symbol = "BANK";
  r.company.sector = "Financial Services";
  r.evidence = {
    ...r.evidence,
    profile: {
      ...r.evidence?.profile,
      sector: "Financial Services",
      industry: "Banks - Regional",
    },
  };
  const reading = researchEdge(r);
  assert.equal(reading.verdict, "Sector review");
});
test("positive current cash generation is not mislabeled as an improving cash trend", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.history = r.history.map((b, i) => ({
    ...b,
    open: 2000 - i,
    close: 2000 - i,
    high: 2001 - i,
    low: 1999 - i,
  }));
  const reading = researchEdge(r);
  assert.ok(reading.disconnect);
  assert.doesNotMatch(reading.disconnect.title, /improving/i);
});
test("a labelled recent settled close remains usable for research when a live quote is unavailable", () => {
  const r = structuredClone(demoData.research.MSFT),
    bar = r.history.at(-1);
  r.quote = {
    ...r.quote,
    price: bar.close,
    asOf: bar.time + "T20:00:00Z",
    session: "Last available close",
    stale: true,
  };
  r.priceObservedAt = new Date(
    Date.parse(r.quote.asOf) + 86400000,
  ).toISOString();
  assert.equal(researchEdge(r).referenceBasis, "settled-close");
  r.priceObservedAt = new Date(
    Date.parse(r.quote.asOf) + 6 * 86400000,
  ).toISOString();
  assert.equal(researchEdge(r).referenceBasis, "unavailable");
});
test("Pace is visible before the chart and never presented as a risk-adjusted confirmed value", () => {
  const Component = view();
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: demoData.research.MSFT,
      onTab: () => {},
      chart: React.createElement("div", null, "Price chart"),
    }),
  );
  assert.ok(html.indexOf("AURYN PACE") < html.indexOf("Price chart"));
  assert.match(html, /Why not stronger/);
  assert.match(html, /AURYN CHECKPOINTS/);
  assert.doesNotMatch(html, /edge-reading-bar|Not assessed|Not established/);
});
test("Detailed mode exposes the decision explanation while Simple keeps it collapsed", () => {
  const Component = view(),
    props = { research: demoData.research.MSFT, onTab: () => {} };
  const simple = renderToStaticMarkup(React.createElement(Component, props));
  const detailed = renderToStaticMarkup(
    React.createElement(Component, { ...props, pro: true }),
  );
  assert.doesNotMatch(simple, /<details class="edge-method" open/);
  assert.match(detailed, /<details class="edge-method" open/);
});

test("unestablished scenario upside keeps an explicit interpretation warning", () => {
  const base = researchEdge(demoData.research.MSFT);
  const Component = view(() => ({
    ...base,
    value: "unestablished",
    brief: {
      ...base.brief,
      scenarioEligible: true,
      scenario: {
        currency: "USD",
        low: 2000,
        base: 3000,
        high: 4000,
        end: "2028-12-31",
      },
    },
  }));
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: demoData.research.MSFT,
      onTab: () => {},
    }),
  );
  assert.match(html, /model assumptions need closer review/);
});

test("historical price card keeps listing currency when an unused revenue scenario has another reporting currency", () => {
  const base = researchEdge(demoData.research.MSFT);
  const Component = view(() => ({
    ...base,
    value: "unestablished",
    brief: {
      ...base.brief,
      scenarioEligible: false,
      scenario: {
        currency: "EUR",
        low: 90,
        base: 110,
        high: 130,
        end: "2028-12-31",
      },
      priceRisk: {
        available: true,
        currency: "USD",
        cases: [
          { name: "Bear", target: 80, change: -20 },
          { name: "Base", target: 100, change: 0 },
          { name: "Bull", target: 120, change: 20 },
        ],
      },
    },
  }));
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      research: demoData.research.MSFT,
      onTab: () => {},
    }),
  );
  assert.match(html, /data-scale-currency="USD"/);
  assert.doesNotMatch(html, /data-scale-currency="EUR"/);
  assert.match(html, /Past price outcomes/);
});
