import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as simulation from "../lib/options-simulation.ts";
function render(selected = "") {
  let index = 0;
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("components/OptionsSimulation.tsx", "utf8"),
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
      if (name === "react")
        return {
          ...React,
          useState(initial) {
            index++;
            return [
              index === 2
                ? selected
                : typeof initial === "function"
                  ? initial()
                  : initial,
              () => {},
            ];
          },
        };
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/options-simulation") return simulation;
      if (name === "@/lib/client")
        return {
          api() {
            throw Error("Unexpected network");
          },
        };
      if (name === "./Session")
        return {
          useProduct: () => ({ owner: "test", demo: true }),
          useResource: () => ({ data: { documents: [] } }),
        };
      if (name.endsWith(".css"))
        return { default: new Proxy({}, { get: (_, p) => String(p) }) };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const contracts = [20, 99, 110].map((strike) => ({
    id: `TEST271217C${String(strike * 1000).padStart(8, "0")}`,
    strike,
    type: "call",
    expiry: "2027-12-17",
    observed: new Date().toISOString(),
    bid: 4,
    ask: 5,
    multiplier: 100,
    standard: true,
    oi: null,
    volume: null,
    iv: null,
    delta: null,
    gamma: null,
    theta: null,
    vega: null,
  }));
  return renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      contracts,
      symbol: "TEST",
      spot: 100,
    }),
  );
}
test("practice defaults to nearest eligible strike and shows total premium before submission", () => {
  const html = render();
  assert.match(html, /<option value="TEST271217C00099000" selected=""/);
  assert.match(html, /Total premium.*\$500\.00/);
  assert.match(html, /Maximum loss/);
});
test("practice preserves an explicit contract selection", () => {
  assert.match(
    render("TEST271217C00110000"),
    /<option value="TEST271217C00110000" selected=""/,
  );
});
test("practice keeps saving and assumptions collapsed", () => {
  const html = render();
  assert.match(
    html,
    /<details[^>]*><summary>Save &amp; load ledger<\/summary>/,
  );
  assert.match(
    html,
    /<details[^>]*><summary>Simulation assumptions<\/summary>/,
  );
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
});
