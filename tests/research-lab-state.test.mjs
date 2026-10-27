import { loadComparison, comparisonCompatibility } from "../lib/comparison.ts";
import { researchEdge } from "../lib/edge-research.ts";
import { providerSymbol, sameProviderSymbol } from "../lib/provider-symbol.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { perspective } from "../lib/analysis.ts";
import { compareDca } from "../lib/planning.ts";
import * as format from "../lib/format.ts";
function nodeOf(tree, type) {
  if (!tree || typeof tree !== "object") return null;
  if (tree.type === type) return tree;
  for (const c of React.Children.toArray(tree.props?.children)) {
    const hit = nodeOf(c, type);
    if (hit) return hit;
  }
  return null;
}
test("a failed research-lab request clears the previous instrument result", async () => {
  const source = ts.createSourceFile(
    "ResearchLab.tsx",
    fs.readFileSync("components/ResearchLab.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "ResearchLab",
  );
  const code = ts.transpileModule(
    declaration.getText(source).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const state = [
    "HIMS",
    10,
    {
      company: { symbol: "APP", assetType: "stock" },
      quote: { currency: "USD" },
      history: [],
      retrievedAt: "2026-10-17",
    },
    false,
    "",
  ];
  let index = 0;
  const empty = () => null;
  const bindings = {
    PaceHelp: () => null,
    providerSymbol,
    React,
    ...format,
    useState: () => {
      const i = index++;
      return [
        state[i],
        (v) => {
          state[i] = v;
        },
      ];
    },
    useMemo: (f) => f(),
    useProduct: () => ({}),
    api: async () => {
      throw Error("Unavailable");
    },
    compareDca,
    PageHeading: empty,
    Notice: empty,
    Empty: empty,
    Help: empty,
    MiniChart: empty,
    FlaskConical: empty,
    Download: empty,
  };
  const Component = new Function(
    ...Object.keys(bindings),
    code + ";return ResearchLab;",
  )(...Object.values(bindings));
  const tree = Component();
  await nodeOf(tree, "form").props.onSubmit({ preventDefault() {} });
  assert.equal(state[2], null);
  assert.equal(state[3], false);
  assert.equal(state[4], "Unavailable");
});
test("a new comparison clears the preceding company set before loading", async () => {
  const source = ts.createSourceFile(
    "SupportingViews.tsx",
    fs.readFileSync("components/SupportingViews.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Compare",
  );
  const code = ts.transpileModule(
    declaration.getText(source).replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const old = {
    company: { symbol: "APP" },
    quote: {},
    history: [],
    facts: [],
    retrievedAt: "2026-10-17",
  };
  const state = ["HIMS,NIO", "HIMS,NIO", [old], "", false],
    effects = [];
  let index = 0;
  const empty = () => null;
  const bindings = {
    React,
    ...format,
    useState: () => {
      const i = index++;
      return [
        state[i],
        (v) => {
          state[i] = v;
        },
      ];
    },
    useEffect: (f) => effects.push(f),
    useMemo: (f) => f(),
    useProduct: () => ({}),
    useResource: () => ({}),
    api: async () => {
      throw Error("Unavailable");
    },
    perspective,
    researchEdge,
    loadComparison,
    comparisonCompatibility,
    sameProviderSymbol,
    Search: empty,
    PaceHelp: empty,
    PaceReadings: empty,
    PageHeading: empty,
    Notice: empty,
    Empty: empty,
    Help: empty,
    Link: empty,
    SecurityLogo: empty,
  };
  const Component = new Function(
    ...Object.keys(bindings),
    code + ";return Compare;",
  )(...Object.values(bindings));
  Component({ initialSymbols: "HIMS,NIO" });
  const cleanup = effects[0]();
  assert.deepEqual(state[2], []);
  await new Promise((r) => setImmediate(r));
  cleanup();
});
