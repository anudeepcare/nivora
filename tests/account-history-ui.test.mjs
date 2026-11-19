import { accountHistoryWindow } from "../lib/account-history-window.ts";
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
  const effects = [];
  let resize;
  const bindings = {
    accountHistoryWindow,
    React,
    styles: new Proxy({}, { get: (_, key) => key }),
    useEffect: (effect) => {
      effects.push(effect);
    },
    ResizeObserver: class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
    useRef: (initial) => {
      const i = cursor++;
      if (!(i in state)) state[i] = { current: initial };
      return state[i];
    },
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
      if (path === "account-history/jobs" && !body.id)
        return {
          id: "job1",
          completed: 0,
          total: 2,
          result: null,
          retry: false,
        };
      return path === "transactions"
        ? { revision: serverRevision, rows: [] }
        : {
            id: "job1",
            completed: 2,
            total: 2,
            retry: false,
            result: {
              status: "available",
              reason: "Confirmed",
              benchmarks: [
                {
                  symbol: "SPY",
                  status: "available",
                  points: [
                    { date: "2026-01-02", value: 1000 },
                    { date: "2026-01-06", value: 1300 },
                  ],
                  source: "EODHD",
                  basis: "split-dividend-adjusted",
                },
              ],
              revision: 7,
              points: [
                {
                  date: "2026-01-02",
                  equity: 1100,
                  cash: 500,
                  netContributions: 1000,
                  gain: 100,
                },
                {
                  date: "2026-01-06",
                  equity: 1200,
                  cash: 500,
                  netContributions: 1000,
                  gain: 200,
                },
              ],
            },
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
  const buttons = () =>
    nodes().filter((n) => n.type === "button" && n.props.className === "btn");
  assert.equal(calls.length, 0);
  assert.ok(tree.some((n) => n.props.className === "actions"));
  assert.ok(!tree.some((n) => n.props.className === "confirmation"));
  assert.equal(buttons().length, 1);
  assert.ok(!tree.some((n) => n.props.type === "checkbox"));
  await buttons()[0].props.onClick();
  assert.equal(buttons()[1].props.disabled, true);
  assert.equal(
    nodes().find((n) => n.props.type === "checkbox").props.checked,
    false,
  );
  nodes()
    .find((n) => n.type === "input")
    .props.onChange({ target: { checked: true } });
  serverRevision = 8;
  await buttons()[1].props.onClick();
  tree = nodes();
  assert.ok(!tree.some((n) => n.props.type === "checkbox"));
  assert.equal(buttons().length, 1);
  assert.deepEqual(calls[1], [
    "account-history/jobs",
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
    "account-history/jobs",
    { revision: 8, confirmComplete: true, id: "job1" },
  ]);
  assert.ok(tree.some((n) => n.type === "svg"));
  // Model content widths inside 320–430px phone layouts; no browser/render claim.
  tree.find((n) => n.props.className === "chart").props.ref.current = {};
  effects.at(-1)();
  for (const width of [232, 287, 342]) {
    resize([{ contentRect: { width } }]);
    const sized = nodes();
    assert.equal(
      sized.find((n) => n.type === "svg").props.viewBox,
      `0 0 ${width} 210`,
    );
    for (const line of sized.filter((n) => n.type === "polyline")) {
      for (const point of line.props.points.split(" ")) {
        const x = Number(point.split(",")[0]);
        assert.ok(x >= 64 && x <= width - 20, `x=${x} width=${width}`);
      }
    }
  }
  tree = nodes();

  assert.equal(tree.filter((n) => n.type === "polyline").length, 3);
  assert.ok(
    tree.some(
      (n) =>
        n.type === "summary" &&
        n.props.children === "Market comparison · SPY / QQQ",
    ),
  );
  assert.ok(tree.some((n) => n.type === "table"));
  assert.ok(
    tree.some(
      (n) =>
        n.type === "input" &&
        n.props.type === "range" &&
        n.props["aria-label"] === "Inspect account history date",
    ),
  );
  assert.ok(
    tree.some((n) => n.type === "text" && n.props.children === "2026-01-02"),
  );
  assert.ok(
    tree.some((n) => n.type === "text" && n.props.children === "2026-01-06"),
  );
  assert.ok(
    tree.some((n) => n.type === "strong" && n.props.children === "2026-01-06"),
  );
  tree
    .find((n) => n.type === "input" && n.props.type === "range")
    .props.onChange({ target: { value: "0" } });
  assert.ok(
    nodes().some(
      (n) => n.type === "strong" && n.props.children === "2026-01-02",
    ),
  );
  assert.match(
    nodes().find((n) => n.props.type === "range").props["aria-valuetext"] ?? "",
    /2026-01-02.*1100/,
  );
});
