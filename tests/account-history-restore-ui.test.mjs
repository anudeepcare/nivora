import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
for (const late of [false, true])
  test(
    late
      ? "late saved response cannot replace an explicit ledger review"
      : "mount restores saved evidence read-only without checking completeness or starting work",
    async () => {
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
      const states = [],
        effects = [],
        calls = [];
      let cursor = 0;
      let resolveSaved;
      let restoreSignal;
      const saved = {
        status: "unavailable",
        points: [],
        reason: "Missing exact history",
        revision: 7,
        benchmarks: [
          {
            symbol: "SPY",
            status: "unavailable",
            reason: "Missing close",
            points: [],
          },
        ],
      };
      const bindings = {
        React,
        styles: new Proxy({}, { get: (_, key) => key }),
        amount: String,
        useEffect: (fn) => effects.push(fn),
        useRef: (initial) => {
          const i = cursor++;
          if (!(i in states)) states[i] = { current: initial };
          return states[i];
        },
        useState: (initial) => {
          const i = cursor++;
          if (!(i in states)) states[i] = initial;
          return [states[i], (v) => (states[i] = v)];
        },
        api: async (path, body, signal) => {
          calls.push([path, body]);
          if (path === "transactions") return { revision: 8, rows: [] };
          restoreSignal = signal;
          if (late)
            return new Promise((resolve) => {
              resolveSaved = resolve;
            });
          return { result: saved };
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
      nodes();
      const cleanup = effects.map((f) => f());
      if (late) {
        await nodes()
          .find((n) => n.type === "button")
          .props.onClick();
        assert.equal(restoreSignal.aborted, true);
        resolveSaved({ result: saved });
      }
      await new Promise((resolve) => setImmediate(resolve));
      const tree = nodes();
      if (late) {
        assert.deepEqual(calls, [
          ["account-history/jobs", undefined],
          ["transactions", undefined],
        ]);
        assert.ok(
          !tree.some((n) => n.props.children === "Missing exact history"),
        );
        assert.equal(
          tree.find((n) => n.props.type === "checkbox").props.checked,
          false,
        );
        assert.equal(
          tree.filter((n) => n.type === "button")[1].props.disabled,
          true,
        );
        cleanup.forEach((f) => f?.());
        return;
      }
      assert.deepEqual(calls, [["account-history/jobs", undefined]]);
      assert.ok(tree.some((n) => n.props.children === "Missing exact history"));
      assert.ok(tree.some((n) => n.props.children === "Missing close"));
      assert.ok(!tree.some((n) => n.props.type === "checkbox"));
      assert.ok(!tree.some((n) => n.type === "svg"));
      cleanup.forEach((f) => f?.());
    },
  );
