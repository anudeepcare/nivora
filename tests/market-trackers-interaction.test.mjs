import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { trackerGroups } from "../lib/market-trackers.ts";
const dashboardModule = { exports: {} };
new Function(
  "require",
  "module",
  "exports",
  "React",
  ts.transpileModule(
    fs.readFileSync("components/MarketSessionDashboard.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText,
)(
  () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }),
  dashboardModule,
  dashboardModule.exports,
  React,
);
function harness() {
  const src = fs.readFileSync("components/MarketTrackers.tsx", "utf8");
  const ast = ts.createSourceFile(
    "c.tsx",
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const state = [null, 0];
  let cursor = 0;
  const keys = [];
  let reply = { loading: true };
  let retries = 0;
  const C = new Function(
    "React",
    "useState",
    "useResource",
    "trackerGroups",
    "styles",
    "ProductLookup",
    "MarketSessionDashboard",
    js + ";return MarketTrackers",
  )(
    React,
    (v) => {
      let i = cursor++;
      return [state[i] ?? v, (x) => (state[i] = x)];
    },
    (key) => {
      keys.push(key);
      return key === "market-trackers"
        ? {
            data: {
              data: [
                {
                  id: "market-session",
                  name: "Session",
                  description: "LONG DESCRIPTION",
                  tier: "pro",
                },
                {
                  id: "market-heatmap",
                  name: "Prices",
                  description: "LONG DESCRIPTION",
                  tier: "pro",
                },
              ],
            },
            loading: false,
            refresh: () => retries++,
          }
        : { ...reply, refresh: () => retries++ };
    },
    trackerGroups,
    new Proxy({}, { get: (_, k) => k }),
    () => null,
    dashboardModule.exports.default,
  );
  return {
    render() {
      cursor = 0;
      return C();
    },
    keys,
    state,
    setReply: (r) => (reply = r),
    retries: () => retries,
  };
}
function find(n, type) {
  if (!n || typeof n !== "object") return [];
  return [
    ...(n.type === type ? [n] : []),
    ...React.Children.toArray(n.props?.children).flatMap((x) => find(x, type)),
  ];
}
test("tracker selection requests only selected board and gives adjacent loading, error retry and matching results", () => {
  const h = harness();
  let tree = h.render();
  assert.equal(h.keys.at(-1), null);
  const picker = find(tree, "select")[0];
  assert.ok(picker, "compact tracker selector");
  picker.props.onChange({ target: { value: "market-session" } });
  tree = h.render();
  assert.equal(h.keys.at(-1), "market-trackers?id=market-session");
  assert.match(renderToStaticMarkup(tree), /Loading selected snapshot/);
  h.setReply({ loading: false, error: "Temporarily unavailable" });
  tree = h.render();
  assert.match(renderToStaticMarkup(tree), /Temporarily unavailable/);
  find(tree, "button")
    .find((x) => x.props.children === "Retry snapshot")
    .props.onClick();
  assert.equal(h.retries(), 1);
  h.setReply({
    loading: false,
    data: {
      data: {
        id: "market-session",
        name: "Session",
        description: "Reported observations",
        asOf: "2026-11-18",
        preview: false,
        headline: [{ label: "Volume", value: 0, unit: null, flags: [] }],
        rows: [],
        totalCount: 0,
      },
    },
  });
  assert.match(renderToStaticMarkup(h.render()), /Volume/);
  h.state[0] = "market-heatmap";
  assert.doesNotMatch(
    renderToStaticMarkup(h.render()),
    /Volume/,
    "old board must not appear under new choice",
  );
});
