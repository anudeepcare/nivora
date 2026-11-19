import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("account chart accepts an explicitly labeled holdings-history fallback without synthetic return math", () => {
  const s = fs.readFileSync("components/AccountHistory.tsx", "utf8");
  assert.match(s, /currentHoldingsHistory\?: React.ReactNode/);
  assert.match(s, /Current holdings history/);
  assert.match(
    s,
    /Not (?:your historical\s+account return|actual account performance)/,
  );
  assert.match(s, /Record transaction/);
  assert.match(s, /displayHistory === "holdings"/);
  assert.match(
    s,
    /Benchmarks are hypothetical balances, not percentage returns/,
  );
  assert.doesNotMatch(s, /Set up comparison/);
});

import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { accountHistoryWindow } from "../lib/account-history-window.ts";
test("real component renders only holdings slot by default when account evidence is missing", () => {
  const source = fs.readFileSync("components/AccountHistory.tsx", "utf8");
  const ast = ts.createSourceFile(
    "view.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "AccountHistory",
  );
  const js = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const b = {
    React,
    accountHistoryWindow,
    styles: new Proxy({}, { get: (_, k) => k }),
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useState: (v) => [v, () => {}],
    amount: String,
  };
  const View = new Function(...Object.keys(b), js + ";return AccountHistory;")(
    ...Object.values(b),
  );
  const html = renderToStaticMarkup(
    React.createElement(View, {
      readOnly: true,
      currentHoldingsHistory: React.createElement(
        "div",
        { "data-holdings-history": true },
        "Existing price history",
      ),
    }),
  );
  assert.match(html, /data-holdings-history/);
  assert.match(
    html,
    /Not (?:your historical account return|actual account performance)/,
  );
  assert.match(html, /aria-pressed="true">Current holdings history/);
  assert.doesNotMatch(html, /aria-label="Chart series"/);
});
