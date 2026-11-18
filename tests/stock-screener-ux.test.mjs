import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("stock screener separates condition editor from applied results and exposes explicit units", () => {
  const s = fs.readFileSync("components/StockScreener.tsx", "utf8");
  assert.match(s, /Filters changed/);
  assert.match(s, /Condition 1/);
  assert.match(s, /Value ·/);
  assert.match(s, /ui\.form/);
  assert.match(s, /ui\.results/);
});
test("stock screening preserves signed price observations without coloring analyst forecast as fact", () => {
  const s = fs.readFileSync("components/StockScreener.tsx", "utf8");
  assert.match(s, /data-direction=\{direction\(r.changePercent\)\}/);
  assert.match(s, /data-direction=\{direction\(r.return1Y\)\}/);
  assert.doesNotMatch(
    s,
    /data-direction=\{direction\(r.analystTargetUpsidePct\)\}/,
  );
});

test("rendered edited filter keeps original applied results and factual signed colors", async () => {
  const React = await import("react"),
    ts = await import("typescript"),
    { renderToStaticMarkup } = await import("react-dom/server"),
    fields = await import("../lib/stock-screener.ts");
  const result = {
    withheld: [],
    matched: 1,
    limit: 100,
    source: "fixture",
    retrievedAt: "2026-11-18",
    screen: { field: "MARKET_CAP", op: "GTE", value: 1 },
    results: [
      {
        ticker: "TEST",
        currentPrice: 20,
        priceAsOf: null,
        changePercent: -2,
        marketCap: 100,
        analystCount: null,
        analystTargetUpsidePct: 5,
        return1Y: 10,
        volatility30D: null,
      },
    ],
  };
  const states = [
    "MARKET_CAP",
    "GTE",
    "2",
    result,
    false,
    "",
    0,
    false,
    "ANALYST_COUNT",
    "GTE",
    "",
  ];
  let i = 0;
  const js = ts.default.transpileModule(
    fs.readFileSync("components/StockScreener.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.default.JsxEmit.React,
        module: ts.default.ModuleKind.CommonJS,
        target: ts.default.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const out = {};
  new Function("require", "exports", "React", js)(
    (name) =>
      name === "react"
        ? { useState: () => [states[i++], () => {}] }
        : name === "next/link"
          ? {
              default: ({ children, ...props }) =>
                React.createElement("a", props, children),
            }
          : name === "next/dynamic"
            ? { default: () => () => null }
            : name.endsWith(".css")
              ? { default: new Proxy({}, { get: (_, key) => key }) }
              : name.includes("stock-screener")
                ? fields
                : {},
    out,
    React,
  );
  const html = renderToStaticMarkup(React.createElement(out.default));
  assert.match(html, /Filters changed/);
  assert.match(html, /Applied: Market capitalization \(USD\).*1/);
  assert.match(html, /data-direction="down">-2%/);
  assert.match(html, /data-direction="up">10%/);
  assert.match(html, /Condition 1/);
  assert.match(html, /Time not supplied/);
  assert.match(html, /href="\/research\/TEST"/);
});
