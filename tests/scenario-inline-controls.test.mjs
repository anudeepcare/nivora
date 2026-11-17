import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
test("Test assumptions opens the existing model inline and toggles without changing route", () => {
  const source = fs.readFileSync("components/ValueStudio.tsx", "utf8");
  const ast = ts.createSourceFile(
    "value.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name.text === "ValueStudio",
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
  let open = false;
  const noop = () => null;
  const bindings = {
    React,
    useState: () => [
      open,
      (v) => (open = typeof v === "function" ? v(open) : v),
    ],
    useMemo: (fn) => fn(),
    layout: new Proxy({}, { get: (_, k) => k }),
    valueDesk: () => ({ metrics: [] }),
    modelAssessment: () => ({ methods: [] }),
    scenarioHeadline: () => null,
    consensusOutlook: () => null,
    SelectedValuation: noop,
    ScenarioLenses: noop,
    ExpectationWorkbench: noop,
    DecisionInsights: noop,
    SectionIcon: noop,
    PriceProjection: noop,
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return ValueStudio;",
  )(...Object.values(bindings));
  const research = {
    company: { symbol: "APP", assetType: "stock" },
    retrievedAt: "2026-11-17T12:00:00Z",
  };
  const nodes = (tree) => {
    const out = [];
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      out.push(n);
      React.Children.forEach(n.props?.children, walk);
    };
    walk(tree);
    return out;
  };
  let tree = View({ research });
  let action = nodes(tree).find((n) => n.props?.actions)?.props.actions;
  assert.equal(action.props["aria-expanded"], false);
  assert.equal(
    nodes(tree).some((n) => n.props?.id === "scenario-assumptions"),
    false,
  );
  action.props.onClick();
  tree = View({ research });
  assert.equal(
    nodes(tree).some((n) => n.props?.id === "scenario-assumptions"),
    true,
  );
  action = nodes(tree).find((n) => n.props?.actions)?.props.actions;
  assert.equal(action.props["aria-expanded"], true);
  action.props.onClick();
  assert.equal(
    nodes(View({ research })).some(
      (n) => n.props?.id === "scenario-assumptions",
    ),
    false,
  );
  assert.ok(
    source.indexOf("className={layout.scenarios}") <
      source.indexOf("className={layout.calculator}"),
  );
  assert.doesNotMatch(source, /\bonWorkbench\b|\bswitchTab\b/);
});
