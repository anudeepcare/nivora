import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const source = fs.readFileSync("components/Research.tsx", "utf8");
test("congressional source follows the same saved dataset preference", () => {
  const panels = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  assert.doesNotMatch(source, /<CongressDisclosures/);
  assert.match(panels, /politicians: "congressional"/);
  assert.match(panels, /!hidden.includes/);
  assert.match(panels, /dataset === "politicians" \? \(/);
});
test("failed dataset retry calls the actual resource refresh and reports pending state", () => {
  const text = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  const ast = ts.createSourceFile(
    "panels.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name.text === "Dataset",
  );
  const code = ts.transpileModule(fn.getText(ast), {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let calls = 0;
  const resource = {
    loading: false,
    error: "Provider unavailable",
    refresh: () => calls++,
  };
  const Dataset = new Function(
    "React",
    "useResource",
    "intelligenceView",
    "s",
    code + ";return Dataset;",
  )(
    React,
    () => resource,
    () => ({ title: "Ownership", note: "Dated records", groups: [] }),
    new Proxy({}, { get: (_, k) => k }),
  );
  const tree = Dataset({ symbol: "AAPL", dataset: "holders" });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Retry Ownership/);
  const nodes = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    nodes.push(n);
    React.Children.forEach(n.props?.children, walk);
  };
  walk(tree);
  const button = nodes.find((n) => n.type === "button");
  assert.ok(button);
  button.props.onClick();
  assert.equal(calls, 1);
  resource.loading = true;
  assert.match(
    renderToStaticMarkup(Dataset({ symbol: "AAPL", dataset: "holders" })),
    /Loading ownership/,
  );
});
