import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("components/HomeMarketCards.tsx", "utf8");
const ast = ts.createSourceFile(
  "HomeMarketCards.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "usableHistory",
);
const code = ts.transpileModule(declaration.getText(ast), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const valid = new Function("DAY", code + ";return usableHistory;")(86400000);
const now = Date.parse("2026-11-05T16:00:00Z");
const row = (time, close = 100) => ({ time, close });
test("Home price areas use settled dated observations and never create a decorative trend from stale or invalid data", () => {
  assert.deepEqual(
    valid([row("2026-11-03"), row("2026-11-04"), row("2026-11-05")], now).map(
      (p) => p.time,
    ),
    ["2026-11-03", "2026-11-04"],
  );
  for (const points of [
    [row("2026-10-01"), row("2026-10-02")],
    [row("2026-11-04"), row("2026-11-06")],
    [row("bad"), row("2026-11-04")],
    [row("2026-11-03", 0), row("2026-11-04")],
  ])
    assert.deepEqual(valid(points, now), []);
  assert.deepEqual(
    valid([row("2026-11-04"), row("2026-11-05")], now).map((x) => x.time),
    [],
  );
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
function savedCompanies(props) {
  const declaration = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "HomeMarketCards",
  );
  const compiled = ts.transpileModule(
    declaration.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const bindings = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useProduct: () => ({ cache: new Map(), owner: "test" }),
    savedStyles: { panel: "saved-companies", scroll: "scroll" },
    Link: ({ children, ...p }) => React.createElement("a", p, children),
    DetailDialog: ({ trigger, title }) =>
      React.createElement(
        "button",
        { "aria-haspopup": "dialog", "data-dialog": title },
        trigger,
      ),
    ...format,
  };
  const Component = new Function(
    ...Object.keys(bindings),
    compiled + ";return HomeMarketCards;",
  )(...Object.values(bindings));
  return renderToStaticMarkup(
    React.createElement(Component, {
      symbols: [],
      quotes: {},
      research: [],
      prefix: "/app",
      ...props,
    }),
  );
}
test("saved companies render compact real price rows and bounded history triggers", () => {
  const html = savedCompanies({
    symbols: ["IREN", "IREN", "NBIS"],
    quotes: {
      IREN: {
        company: { name: "IREN Limited" },
        quote: {
          price: 42,
          currency: "USD",
          changePct: -1.2,
          asOf: "2026-11-01T12:00:00Z",
          stale: true,
        },
      },
      NBIS: { quote: { price: 0, asOf: "2026-11-01T12:00:00Z" } },
    },
  });
  assert.match(html, /<table>/);
  assert.match(html, /\$42\.00/);
  assert.match(html, /Last available/);
  assert.match(html, /Quote unavailable/);
  assert.match(html, /data-direction="down"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /2 of 2 saved companies/);
  assert.doesNotMatch(html, /<svg/);
  assert.doesNotMatch(html, /\$0\.00/);
});
test("saved companies keep empty and invalid future prices honest", () => {
  assert.match(savedCompanies({}), /Follow a company/);
  assert.doesNotMatch(
    savedCompanies({
      symbols: ["BAD"],
      quotes: { BAD: { quote: { price: 99, asOf: "2999-01-01" } } },
    }),
    /\$99/,
  );
});
