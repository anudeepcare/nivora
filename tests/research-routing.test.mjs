import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { symbolInput } from "../lib/format.ts";
const source = fs.readFileSync(
  new URL("../components/Product.tsx", import.meta.url),
  "utf8",
);
const ast = ts.createSourceFile(
  "Product.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Product",
);
const code = ts.transpileModule(
  declaration.getText(ast).replace("export default ", ""),
  {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  },
).outputText;
const names = [
  "ProductSession",
  "Shell",
  "Research",
  "ResearchHome",
  "Portfolio",
  "Watchlist",
  "Settings",
  "Compare",
  "Alerts",
  "ResearchLab",
  "Trading",
  "Discover",
  "HelpPage",
  "Overview",
];
const component = new Function(
  "React",
  "symbolInput",
  ...names,
  code + ";return Product;",
)(React, symbolInput, ...names);
for (const base of ["BTC", "ETH"]) {
  test(`${base} research retains the USD pair across encoded, split and hyphenated routes`, () => {
    for (const tail of [
      [`${base}/USD`],
      [base, "USD"],
      [`${base}-USD`],
      [`${base}%2FUSD`],
    ]) {
      const tree = component({ route: ["research", ...tail] });
      assert.equal(
        tree.props.children.props.children.props.symbol,
        `${base}/USD`,
      );
    }
  });
  test(`explicit ${base} equity route remains a distinct instrument`, () => {
    const tree = component({ route: ["research", base] });
    assert.equal(tree.props.children.props.children.props.symbol, base);
  });
}
