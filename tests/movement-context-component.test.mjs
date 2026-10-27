import { customerText } from "../lib/customer-language.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
import { movementContext } from "../lib/movement-context.ts";
const wallClock = Date.parse("2026-10-28T13:24:00Z");
const fixture = () => ({
  company: {
    symbol: "TEST",
    name: "Test",
    assetType: "stock",
    currency: "USD",
    exchange: "NASDAQ",
  },
  quote: {
    price: 120,
    previousClose: 100,
    changePct: 20,
    currency: "USD",
    asOf: "2026-10-26T13:23:00Z",
    session: "Live · premarket",
    source: "Sample quote",
    stale: false,
  },
  history: [],
  retrievedAt: "2026-10-26T13:24:00Z",
  facts: [],
  filings: [],
  issues: [],
});
function renderMovement(demo, research = fixture()) {
  const source = fs.readFileSync("components/MovementContext.tsx", "utf8");
  const ast = ts.createSourceFile(
    "MovementContext.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast))
      .join("\n")
      .replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const empty = () => null;
  const bindings = { customerText,
    React,
    ...format,
    movementContext,
    useMemo: (f) => f(),
    useEffect: empty,
    useRef: (current) => ({ current }),
    useState: () => [wallClock, empty],
    useProduct: () => ({ demo }),
    useResource: () => ({
      data: { items: [] },
      loading: false,
      error: "",
      refresh: empty,
    }),
    ArrowUpRight: empty,
    ChevronDown: empty,
  };
  const Component = new Function(
    ...Object.keys(bindings),
    code + ";return MovementContext;",
  )(...Object.values(bindings));
  return renderToStaticMarkup(Component({ research, onNews: empty }));
}
test("an explicitly labelled demo uses its frozen retrieval clock for movement", () => {
  const html = renderMovement(true);
  assert.match(html, /Today’s move/);
  assert.match(html, /\+20\.0%/);
  assert.doesNotMatch(html, /Older quote/);
});
test("production movement still expires against the wall clock", () => {
  assert.match(renderMovement(false), /Older quote/);
});
test("a price without a valid change is labelled latest price, never today's move", () => {
  const r = fixture();
  r.quote.changePct = null;
  r.quote.previousClose = null;
  const html = renderMovement(true, r);
  assert.match(html, /Latest price/);
  assert.doesNotMatch(html, /Today’s move/);
});
test("the compact strip omits absent metrics and keeps precise source status in details", () => {
  const html = renderMovement(true),
    summary = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)[1];
  assert.doesNotMatch(
    summary,
    /Unavailable|Relative volume|Unconfirmed|Not applicable/,
  );
  assert.match(summary, /News &amp; context/);
  assert.match(html, /Settled daily volume unavailable/);
  assert.match(html, /Earnings calendar unavailable/);
});
