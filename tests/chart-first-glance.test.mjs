import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function load(path, name, bindings) {
  const ast = ts.createSourceFile(
    "x.tsx",
    fs.readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const code = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
function nodes(tree) {
  const out = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    out.push(n);
    React.Children.forEach(n.props?.children, walk);
  };
  walk(tree);
  return out;
}
test("one chart toolbar retains interval, Fibonacci and reference toggle; price detail follows plot", () => {
  const state = [];
  let cursor = 0;
  const marker = () => null;
  const View = load("components/PriceStudyChart.tsx", "PriceStudyChart", {
    React,
    useMemo: (f) => f(),
    useState: (v) => {
      const i = cursor++;
      state[i] ??= v;
      return [
        state[i],
        (x) => (state[i] = typeof x === "function" ? x(state[i]) : x),
      ];
    },
    indicators: () => ({ ma50: 100 }),
    consensusOutlook: () => null,
    advancedStudies: () => ({ fib: null }),
    Layers: marker,
    ArrowRight: marker,
    Info: marker,
    Help: marker,
    PriceChart: marker,
    StockFacts: marker,
    amount: String,
    dateLabel: String,
    s: {
      tools: "tools",
      references: "references",
      referenceDetails: "referenceDetails",
    },
  });
  const props = {
    research: { history: [], quote: { currency: "USD" } },
    bars: [],
    range: "1Y",
    style: "line",
    controls: React.createElement(
      "div",
      { "aria-label": "Chart interval" },
      "Daily Weekly Monthly",
    ),
  };
  const render = () => {
    cursor = 0;
    return nodes(View(props));
  };
  let tree = render();
  const toolbar = tree.find(
    (n) => n.props.className === "signal-chart-tools tools",
  );
  assert.ok(
    nodes(toolbar).some((n) => n.props["aria-label"] === "Chart interval"),
  );
  const toggle = nodes(toolbar).find(
    (n) => n.type === "button" && !n.props["aria-label"],
  );
  assert.equal(toggle.props["aria-pressed"], true);
  assert.equal(toggle.props.children, "Reference lines");
  toggle.props.onClick();
  tree = render();
  assert.equal(
    tree.find((n) => n.type === marker && "bars" in n.props).props.levels
      .length,
    0,
  );
  const hiddenToggle = tree.find(
    (n) => n.type === "button" && n.props.children === "Reference lines",
  );
  assert.equal(hiddenToggle.props["aria-pressed"], false);
  const references = tree.find((n) => n.props.className === "referenceDetails");
  const summary = nodes(references).find((n) => n.type === "summary");
  assert.match(
    React.Children.toArray(summary.props.children).join(""),
    /not plotted/,
  );
  assert.match(renderToStaticMarkup(references), /50-session 100/);
  assert.ok(
    tree.findIndex((n) => n.type === marker && "bars" in n.props) <
      tree.findIndex((n) => n.props.className === "referenceDetails"),
  );
});
test("analyst upside label explicitly distinguishes settled-close reference from quote", () => {
  for (const [basis, status, label] of [
    ["settled-close", "current", "Versus settled close"],
    ["settled-close", "older", "Versus older settled close"],
    ["quote", "current", "Versus current quote"],
  ]) {
    const View = load("components/AnalystTargets.tsx", "AnalystTargets", {
      React,
      consensusOutlook: () => ({
        target: 110,
        referencePrice: 100,
        change: 10,
        referenceBasis: basis,
        referenceStatus: status,
      }),
      amount: String,
      percent: String,
      dateLabel: String,
      styles: { root: "targets" },
    });
    const html = renderToStaticMarkup(
      React.createElement(View, { research: { quote: { currency: "USD" } } }),
    );
    assert.match(html, new RegExp(label));
    assert.doesNotMatch(html, /Versus current price/);
  }
});
test("promotional comparison header removed without deleting the workbench", () => {
  const s = fs.readFileSync("components/ContributionCompare.tsx", "utf8");
  assert.doesNotMatch(s, /Compare your companies|heroArt/);
  assert.match(s, /Compare contribution choices/);
  assert.match(s, /aria-expanded=\{open\}/);
  assert.match(s, /SearchableSelect/);
});
test("Atlas center displays a labeled evidence reading, not a duplicated Pace badge", () => {
  const s = fs.readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(s, /REV GROWTH/);
  assert.match(s, /RSI · 14/);
  assert.match(s, /\{centerValue\}/);
  assert.match(s, /reading\(signal, b.businessNumbers.currency\)/);
  assert.doesNotMatch(s, /AURYN VIEW/);
});
