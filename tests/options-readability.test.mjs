import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import * as analysis from "../lib/options-analysis.ts";
import * as presentation from "../lib/options-presentation.ts";
import * as format from "../lib/format.ts";
const expiry = "2027-02-19";
const contracts = ["call", "put"].flatMap((type) =>
  [95, 100, 105].map((strike) => ({
    id: `${type}-${strike}`,
    type,
    strike,
    expiry,
    observed: new Date().toISOString(),
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
function render(chain) {
  let count = 0;
  const hooks = {
    ...React,
    useEffect() {},
    useState(initial) {
      count++;
      return [count === 1 ? chain : count === 2 ? [expiry] : initial, () => {}];
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
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
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
          default: { desk: "options-desk-owned", rangeLabel: "range-label" },
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
test("Options populated snapshot renders range, gamma coverage and expiration controls", () => {
  const html = render({
    symbol: "TEST",
    contracts,
    complete: true,
    frequency: "Indicative feed: synthetic QA",
    fetchedAt: new Date().toISOString(),
  });
  assert.match(html, /Option-priced move at expiration/);
  assert.match(html, /Estimated net gamma/);
  assert.match(html, /100% input coverage/);
  assert.match(html, /Options expiration/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
test("Options no-input state explains absence and does not invent a range", () => {
  const html = render(null);
  assert.match(html, /No options snapshot available/);
  assert.doesNotMatch(
    html,
    /Estimated net gamma|Option-priced move at expiration/,
  );
});
