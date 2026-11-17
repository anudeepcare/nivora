import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
test("history is explicit, confirmed, revision-bound and renders actual returned values", async () => {
  const ast = ts.createSourceFile(
    "view.tsx",
    fs.readFileSync("components/AccountHistory.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "AccountHistory",
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
  const state = [];
  let cursor = 0;
  let serverRevision = 7;
  const calls = [];
  const bindings = {
    React,
    useState: (initial) => {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], (v) => (state[i] = v)];
    },
    amount: (v) => String(v),
    api: async (path, body) => {
      calls.push([path, body]);
      if (body && body.revision !== serverRevision)
        throw Error("Reload transactions before calculating history.");
      return path === "transactions"
        ? { revision: serverRevision, rows: [] }
        : {
            status: "available",
            reason: "Confirmed",
            revision: 7,
            points: [
              {
                date: "2026-01-02",
                equity: 1100,
                cash: 500,
                netContributions: 1000,
                gain: 100,
              },
            ],
          };
    },
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return AccountHistory;",
  )(...Object.values(bindings));
  const nodes = () => {
    cursor = 0;
    const out = [];
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      out.push(n);
      React.Children.forEach(n.props?.children, walk);
    };
    walk(View());
    return out;
  };
  let tree = nodes();
  const buttons = () => nodes().filter((n) => n.type === "button");
  assert.equal(calls.length, 0);
  assert.equal(buttons()[1].props.disabled, true);
  assert.equal(tree.find((n) => n.type === "input").props.disabled, true);
  await buttons()[0].props.onClick();
  nodes()
    .find((n) => n.type === "input")
    .props.onChange({ target: { checked: true } });
  serverRevision = 8;
  await buttons()[1].props.onClick();
  tree = nodes();
  assert.equal(tree.find((n) => n.type === "input").props.checked, false);
  assert.equal(tree.find((n) => n.type === "input").props.disabled, true);
  assert.equal(buttons()[1].props.disabled, true);
  assert.deepEqual(calls[1], [
    "account-history",
    { revision: 7, confirmComplete: true },
  ]);
  assert.ok(!tree.some((n) => n.type === "svg"));
  await buttons()[0].props.onClick();
  assert.equal(nodes().find((n) => n.type === "input").props.checked, false);
  nodes()
    .find((n) => n.type === "input")
    .props.onChange({ target: { checked: true } });
  await buttons()[1].props.onClick();
  tree = nodes();
  assert.deepEqual(calls.at(-1), [
    "account-history",
    { revision: 8, confirmComplete: true },
  ]);
  assert.ok(tree.some((n) => n.type === "svg"));
  assert.ok(tree.some((n) => n.type === "table"));
});
