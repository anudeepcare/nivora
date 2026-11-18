import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  optionObservations,
  defaultOptionMetric,
  optionObservationMetrics,
} from "../lib/options-observations.ts";
test("options chart rerenders actual chosen metric and keyboard observation control", () => {
  const ast = ts.createSourceFile(
    "chart.tsx",
    fs.readFileSync("components/OptionsObservationChart.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export default /, ""))
    .join("\n");
  const code = ts.transpileModule(body, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const states = [];
  let cursor = 0;
  const bindings = {
    React,
    optionObservations,
    defaultOptionMetric,
    optionObservationMetrics,
    styles: new Proxy({}, { get: (_, k) => k }),
    useState: (initial) => {
      const i = cursor++;
      return [states[i] ?? initial, (v) => (states[i] = v)];
    },
  };
  const C = new Function(
    ...Object.keys(bindings),
    code + ";return OptionsObservationChart;",
  )(...Object.values(bindings));
  const props = {
    intraday: false,
    data: {
      series: [
        { date: "2026-01-01", atmIv: 0.4, pcVol: 0.8 },
        { date: "2026-01-02", atmIv: 0.5, pcVol: 1.1 },
      ],
    },
  };
  const render = () => {
    cursor = 0;
    return renderToStaticMarkup(React.createElement(C, props));
  };
  const original = props.data;
  for (const metric of ["pcVol", "callVol", "putVol"]) {
    props.data = {
      series: [
        { date: "2026-11-16", [metric]: 1e308 },
        { date: "2026-11-17", [metric]: 1.7e308 },
      ],
    };
    const extreme = render();
    assert.doesNotMatch(extreme, /Infinity|NaN|∞/);
    assert.equal((extreme.match(/<circle/g) || []).length, 2);
  }

  props.data = { series: [{ date: "2026-11-17", callVol: 150 }] };
  assert.match(render(), /150 contracts/);
  props.data = { series: [] };
  assert.match(render(), /No dated observations supplied/);
  props.data = original;
  assert.match(render(), /50 %/);
  cursor = 0;
  const tree = C(props);
  tree.props.children[0].props.children[1].props.onClick();
  const html = render();
  assert.match(html, /1.1 ×/);
  props.data = { series: [{ date: "2026-11-17", callVol: 150 }] };
  assert.match(render(), /No dated observations supplied/);
  props.data = original;
  assert.doesNotMatch(html, /50 %/);
  assert.match(html, /type="range"/);
  assert.match(html, /not interpolated/);
  assert.equal((html.match(/<circle/g) || []).length, 2);
});
