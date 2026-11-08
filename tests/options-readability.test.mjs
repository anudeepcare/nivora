import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import * as analysis from "../lib/options-analysis.ts";
import * as context from "../lib/options-context.ts";
import * as presentation from "../lib/options-presentation.ts";
import * as format from "../lib/format.ts";
import * as quoteQuality from "../lib/options-liquidity.ts";
const expiry = "2027-02-19";
const observed = new Date().toISOString();
const contracts = ["call", "put"].flatMap((type) =>
  [95, 100, 105].map((strike) => ({
    id: `${type}-${strike}`,
    type,
    strike,
    expiry,
    observed,
    bid: 4,
    ask: 5,
    oi: 100,
    volume: 20,
    iv: 0.3,
    delta: type === "call" ? 0.5 : -0.5,
    gamma: 0.02,
    theta: -0.01,
    vega: 0.1,
    multiplier: 100,
    standard: true,
  })),
);
function render(chain, view = "positioning") {
  let count = 0;
  const hooks = {
    ...React,
    useEffect() {},
    useState(initial) {
      count++;
      return [
        count === 1
          ? chain
          : count === 2
            ? [expiry]
            : count === 6
              ? view
              : initial,
        () => {},
      ];
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("components/OptionsDesk.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "./SearchableSelect")
        return {
          __esModule: true,
          default: ({ label }) => React.createElement("button", null, label),
        };
      if (name === "./MarketWorkspace")
        return {
          __esModule: true,
          default: () =>
            React.createElement("section", null, "Exposure workspace"),
        };
      if (
        [
          "./VannaMap",
          "./OptionsTape",
          "./OptionsSimulation",
          "./OptionsSnapshot",
          "./OptionsExpiryComparison",
        ].includes(name)
      )
        return { __esModule: true, default: () => null };
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
      if (name === "@/lib/options-context") return context;
      if (name === "@/lib/options-liquidity") return quoteQuality;
      if (name === "@/lib/options-analysis") return analysis;
      if (name === "@/lib/options-presentation") return presentation;
      if (name === "@/lib/format") return format;
      if (name === "@/lib/client")
        return {
          api: () => {
            throw Error("No network in render test");
          },
        };
      if (name.endsWith(".module.css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  return renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      research: {
        company: { symbol: "TEST" },
        quote: { price: 100, currency: "USD", asOf: new Date().toISOString() },
      },
      preview: true,
    }),
  );
}
test("Options populated snapshot shows range and expiry with diagnostics available on demand", () => {
  const html = render({
    symbol: "TEST",
    contracts,
    complete: true,
    frequency: "Indicative feed: synthetic QA",
    fetchedAt: new Date().toISOString(),
  });
  assert.match(html, /Option-priced range/);
  assert.doesNotMatch(html, /Estimated net gamma/);
  const diagnostics = render(
    { symbol: "TEST", contracts, complete: true },
    "diagnostics",
  );
  assert.match(diagnostics, /Estimated net gamma/);
  assert.match(diagnostics, /100% input coverage/);
  assert.match(html, /Expiration date/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
test("Options no-input state explains absence and does not invent a range", () => {
  const html = render(null);
  assert.match(html, /No options snapshot available/);
  assert.doesNotMatch(html, /Estimated net gamma|Option-priced range/);
});
test("partial gamma inputs never render an aggregate net gamma total", () => {
  const html = render(
    {
      symbol: "TEST",
      contracts: contracts.map((c, i) => (i === 0 ? { ...c, gamma: null } : c)),
      complete: false,
    },
    "diagnostics",
  );
  const text = html.replace(/<[^>]+>/g, "").replace(/<!--.*?-->/g, "");
  assert.match(text, /Estimated net gammaNot measured/);
});

test("price levels opens with one toolbar and immediate analysis, with details below", () => {
  const html = render({ symbol: "TEST", contracts, complete: true });
  assert.equal((html.match(/<header/g) || []).length, 1);
  assert.doesNotMatch(html, /<h2|options-desk|depth-options/);
  assert.match(html, /Exposure workspace/);
  assert.doesNotMatch(html, /Session activity/);
  assert.match(html, /<select aria-label="Expiration date"/);
  assert.match(html, /Data &amp; definitions/);
  assert.match(html, /Quote quality/);
  assert.match(html, /6\/6 contracts have two-sided quotes/);
  assert.doesNotMatch(
    html,
    /Volatility &amp; model diagnostics|Concentrations &amp; gamma/,
  );
});

test("contract inspection and guide remain independently accessible", () => {
  const chain = { symbol: "TEST", contracts, complete: true };
  const table = render(chain, "chain");
  assert.match(table, /Bid \/ ask/);
  assert.match(table, /Cost at ask/);
  assert.match(table, /Liquid contracts only/);
  assert.match(table, /Payoff/);
  const guide = render(chain, "learn");
  assert.match(guide, /Options essentials/);
  assert.match(guide, /Open interest &amp; GEX/);
});
