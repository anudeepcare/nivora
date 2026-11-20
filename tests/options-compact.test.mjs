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
        react: React,
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
  assert.doesNotMatch(html, /Volume and open interest are not supplied/);
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

test("long expiration lists show a complete first page and can reach later dates without vertical clipping", () => {
  const entries = Array.from({ length: 13 }, (_, i) => ({
    ...contract,
    id: "row-" + i,
    expiry: "2027-02-" + String(10 + i),
  }));
  const html = render("OptionsExpiryComparison", {
    contracts: entries,
    active: entries[11].expiry,
    onChoose() {},
  });
  assert.match(html, /7–12 of 13/);
  assert.match(html, /aria-label="Next expirations"/);
  assert.match(html, /aria-pressed="true"/);
  assert.equal((html.match(/<tr data-selected/g) || []).length, 6);
  const first = render("OptionsExpiryComparison", {
    contracts: entries,
    active: entries[0].expiry,
    onChoose() {},
  });
  const last = render("OptionsExpiryComparison", {
    contracts: entries,
    active: entries[12].expiry,
    onChoose() {},
  });
  assert.match(
    first,
    /<button type="button" aria-disabled="true" aria-label="Previous expirations"/,
  );
  assert.match(
    last,
    /<button type="button" aria-disabled="true" aria-label="Next expirations"/,
  );
  assert.doesNotMatch(
    first + last,
    /<button type="button" disabled="" aria-label="(?:Previous|Next) expirations"/,
  );
  const source = fs.readFileSync(
    "components/OptionsExpiryComparison.tsx",
    "utf8",
  );
  assert.match(source, /if \(page > 0\)\s+setBrowsedPage/);
  assert.match(source, /if \(page \+ 1 < pageCount\)\s+setBrowsedPage/);
  const css = fs.readFileSync(
    "components/OptionsExpiryComparison.module.css",
    "utf8",
  );
  assert.doesNotMatch(css, /max-height:/);
  assert.match(css, /overflow-x: auto/);
});
