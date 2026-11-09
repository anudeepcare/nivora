import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import * as format from "../lib/format.ts";
const code = ts.transpileModule(
  fs.readFileSync("components/ResearchBrief.tsx", "utf8"),
  {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  },
).outputText;
function views({ target = true, rsi = 76 } = {}) {
  const mod = { exports: {} };
  const dependencies = {
    react: React,
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "@/lib/format": format,
    "@/lib/analysis": {
      indicators: () => ({ rsi, ma200: 110 }),
      latestFinancialEvidence: () => ({
        latest: { end: "2026-09-30" },
        periodBasis: "TTM",
      }),
    },
    "@/lib/outlook": {
      consensusOutlook: () =>
        target ? { target: 120, referencePrice: 100 } : null,
    },
    "@/lib/movement-context": { movementContext: () => ({ change: null }) },
    "@/lib/auryn-decision": {
      aurynDecision: (_, options) => ({
        actionLabel: options.ownsPosition ? "Hold" : "Watch",
        pace: { level: 1 },
        reference: {
          price: 100,
          currency: "USD",
          asOf: "2026-11-06",
          basis: "settled-close",
        },
      }),
    },
    "./ResearchBrief.module.css": { __esModule: true, default: {} },
  };
  new Function("require", "module", "exports", code)(
    (name) => {
      if (!(name in dependencies)) throw Error(name);
      return dependencies[name];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const research = {
  retrievedAt: "2026-11-08T12:00:00Z",
  history: [],
  quote: { price: 999, currency: "USD" },
  company: { symbol: "TEST" },
};
test("brief uses the selected reference denominator and the holding decision", () => {
  const { OverviewBrief } = views();
  const html = renderToStaticMarkup(
    React.createElement(OverviewBrief, {
      research,
      now: Date.parse(research.retrievedAt),
      owns: true,
    }),
  );
  assert.match(html, /Hold · Zone P1/);
  assert.match(html, /\+20\.0% to the \$120\.00 analyst target/);
  assert.doesNotMatch(html, /16\.7%|999|NaN/);
});
test("brief omits absent targets and momentum instead of fabricating values", () => {
  const { OverviewBrief } = views({ target: false, rsi: null });
  const html = renderToStaticMarkup(
    React.createElement(OverviewBrief, {
      research,
      now: Date.parse(research.retrievedAt),
    }),
  );
  assert.match(html, /Watch · Zone P1/);
  assert.doesNotMatch(html, /analyst target|RSI|NaN|Infinity/);
});
test("freshness distinguishes missing datasets from the report period", () => {
  const { DataFreshness } = views();
  const html = renderToStaticMarkup(
    React.createElement(DataFreshness, {
      research,
      now: Date.parse(research.retrievedAt),
      wide: true,
    }),
  );
  assert.equal((html.match(/Not supplied/g) || []).length, 2);
  assert.match(html, /Sep 30, 2026 · TTM/);
  assert.match(html, /Nov 6, 2026 · Completed close/);
  assert.doesNotMatch(html, /Nov 8, 2026 · (TTM|Completed close)/);
});

test("freshness labels old and invalid datasets without a green availability indicator", () => {
  const { DataFreshness } = views();
  const r = {
    ...research,
    evidence: {
      updatedAt: "2020-01-01",
      consensus: { target: 100 },
      ownership: { institutions: 10 },
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(DataFreshness, {
      research: r,
      now: Date.parse(research.retrievedAt),
    }),
  );
  assert.match(html, /Older dataset · refresh/);
  assert.match(html, /Dated disclosure · verify source/);
  const invalid = renderToStaticMarkup(
    React.createElement(DataFreshness, {
      research: { ...r, evidence: { ...r.evidence, updatedAt: "2026-02-30" } },
      now: Date.parse(research.retrievedAt),
    }),
  );
  assert.doesNotMatch(invalid, /Mar 2, 2026/);
  assert.equal((invalid.match(/Not supplied/g) || []).length, 2);
});
test("a quote reference retains its time while a settled close remains date-only", () => {
  const { DataFreshness } = views();
  const html = renderToStaticMarkup(
    React.createElement(DataFreshness, {
      research,
      now: Date.parse(research.retrievedAt),
      decision: {
        reference: {
          price: 100,
          currency: "USD",
          asOf: "2026-11-08T11:59:00Z",
          basis: "quote",
        },
      },
    }),
  );
  assert.match(html, /11:59 UTC/);
});

test("overview leads with decision, business evidence and risk without repeating the quote move", () => {
  const { OverviewBrief } = views();
  const html = renderToStaticMarkup(
    React.createElement(OverviewBrief, {
      research,
      now: Date.parse(research.retrievedAt),
      decision: {
        actionLabel: "Review business",
        pace: { level: 2 },
        explanation: { detail: "Funding must be reviewed before adding." },
        brief: {
          business: { reason: "Investment exceeds internally generated cash." },
        },
        risks: ["Funding depends on new capital."],
      },
    }),
  );
  assert.match(html, /Investment exceeds internally generated cash/);
  assert.match(html, /Funding depends on new capital/);
  assert.match(html, /not fair value/);
  assert.doesNotMatch(html, /Evidence through|RSI|quoted session references/);
});
