import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("compact uses explicit percent axis and stable SVG series, persistent dollar value", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(s, /data-direction=\{compact \? undefined/);
  assert.match(s, /Price change from shared start/);
  assert.match(s, /selectedPoint \?\? chart.points.at\(-1\)/);
  assert.match(s, /var\(--holdings-series\)/);
  assert.doesNotMatch(s, />\s*Shared start\s*</);
  assert.match(s, /\["1M", "3M", "6M", "1Y", "2Y"\]/);
  assert.match(s, /range=\$\{historyRange\}/);
});

import ts from "typescript";
test("actual compact plotted expression puts common start at zero and preserves signed moves", () => {
  const source = fs.readFileSync(
    "components/ApprovedPortfolioChart.tsx",
    "utf8",
  );
  const ast = ts.createSourceFile(
    "chart.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let expression;
  function visit(n) {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === "plotted")
      expression = n.initializer.getText(ast);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  const js = ts.transpileModule(`const plotted=${expression};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fn = new Function("compact", "chart", js + "return plotted;")(true, {
    points: [{ value: 1000 }],
  });
  assert.equal(fn(1000), 0);
  assert.ok(Math.abs(fn(1100) - 10) < 1e-10);
  assert.ok(Math.abs(fn(900) + 10) < 1e-10);
  const dollars = new Function("compact", "chart", js + "return plotted;")(
    false,
    { points: [{ value: 1000 }] },
  );
  assert.equal(dollars(1100), 1100);
});

test("period selector remains available before loading-dependent chart branches", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.ok(
    s.indexOf('aria-label="Holdings history period"') <
      s.indexOf("{showBenchmarks && chart.points.length > 1"),
  );
});

test("benchmark circles use the same percent transform as paths", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(s, /cy=\{y\(plotted\(b.points.at\(-1\)!\.value\)\)\}/);
  assert.doesNotMatch(s, /cy=\{y\(\s*b.points/);
});

test("short comparison windows state the first available date without relabeling the data", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(
    s,
    /Date.parse\(actualStart\) - Date.parse\(requestedStart\) > 5 \* 86400000/,
  );
  assert.match(
    s,
    /Available history starts \{dateLabel\(chart\.availableFrom\)\}/,
  );
});
