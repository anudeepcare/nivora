import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import * as comparison from "../lib/options-expiry-comparison.ts";
import * as liquidity from "../lib/options-liquidity.ts";
import * as snapshot from "../lib/options-snapshot.ts";
import * as format from "../lib/format.ts";
function render(name, props) {
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(`components/${name}.tsx`, "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name.endsWith(".css")) return { __esModule: true, default: {} };
      const deps = {
        "react/jsx-runtime": jsx,
        "lucide-react": icons,
        "@/lib/options-expiry-comparison": comparison,
        "@/lib/options-liquidity": liquidity,
        "@/lib/options-snapshot": snapshot,
        "@/lib/format": format,
      };
      if (deps[name]) return deps[name];
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  return renderToStaticMarkup(React.createElement(mod.exports.default, props));
}
const contract = {
  id: "a",
  expiry: "2027-02-19",
  type: "call",
  volume: null,
  oi: null,
  observed: "2026-11-06",
  strike: 100,
  standard: true,
  multiplier: 100,
  bid: 1,
  ask: 2,
};
test("missing session volume is one compact note without empty metric cards", () => {
  const html = render("OptionsSnapshot", {
    contracts: [contract],
    spot: 100,
    expiry: contract.expiry,
  });
  assert.equal((html.match(/No volume reported/g) || []).length, 1);
  assert.doesNotMatch(html, /<article/);
});
test("expiration comparison uses rows and omits wholly unavailable columns", () => {
  const html = render("OptionsExpiryComparison", {
    contracts: [contract],
    active: contract.expiry,
    onChoose() {},
  });
  assert.match(html, /<table/);
  assert.doesNotMatch(
    html,
    /<th[^>]*>Call volume|<th[^>]*>Put volume|<th[^>]*>Open interest/,
  );
  assert.match(html, /Volume and open interest are not supplied/);
  assert.match(html, /aria-pressed="true"/);
});
test("reported zero volume remains a visible numeric column", () => {
  const html = render("OptionsExpiryComparison", {
    contracts: [{ ...contract, volume: 0, oi: 0 }],
    active: "",
    onChoose() {},
  });
  assert.match(html, /<th[^>]*>Call volume/);
  assert.match(html, /<td[^>]*>0<\/td>/);
});
test("reported zero session volume is distinguished from missing data", () => {
  const html = render("OptionsSnapshot", {
    contracts: [{ ...contract, volume: 0 }],
    spot: 100,
    expiry: contract.expiry,
  });
  assert.match(html, /No trades reported for this expiration/);
  assert.doesNotMatch(html, /No volume reported/);
});
