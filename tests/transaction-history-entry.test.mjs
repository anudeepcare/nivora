import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as ledger from "../lib/transaction-ledger.ts";
import { HISTORY_JOB_VERSION } from "../lib/account-history-job.ts";
const row = {
  id: "deposit",
  type: "deposit",
  date: "2026-01-02",
  account: "Main",
  symbol: "",
  quantity: 0,
  price: 0,
  amount: 1000,
  fee: 0,
  currency: "USD",
};
function harness() {
  const file = "components/TransactionWorkspace.tsx",
    ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    fn = ast.statements.find(
      (n) =>
        ts.isFunctionDeclaration(n) && n.name?.text === "TransactionWorkspace",
    );
  const js = ts.transpileModule(
    fn.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const states = [];
  let cursor = 0;
  const resource = {
      data: { rows: [row], revision: 3 },
      loading: false,
      refresh: () => {},
    },
    flags = { demo: false };
  const AccountHistory = () => null;
  const b = {
    React,
    ...ledger,
    AccountHistory,
    useProduct: () => flags,
    useResource: () => resource,
    useState: (v) => {
      const i = cursor++;
      if (!(i in states)) states[i] = v;
      return [
        states[i],
        (next) => {
          states[i] = typeof next === "function" ? next(states[i]) : next;
        },
      ];
    },
    amount: String,
    percent: String,
    dateLabel: String,
    s: new Proxy({}, { get: (_, k) => k }),
    api: async () => {},
  };
  const View = new Function(
    ...Object.keys(b),
    js + ";return TransactionWorkspace",
  )(...Object.values(b));
  const nodes = () => {
    cursor = 0;
    const out = [];
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      out.push(n);
      React.Children.forEach(n.props?.children, walk);
    };
    walk(View({ quotes: {}, positions: [] }));
    return out;
  };
  return { nodes, resource, flags, AccountHistory };
}
test("saved ledger exposes opt-in writable comparison only inside transaction workspace", () => {
  const h = harness();
  assert.equal(
    h.nodes().some((n) => n.type === h.AccountHistory),
    false,
  );
  const disclosure = h
    .nodes()
    .find((n) => n.type === "details" && n.props["data-account-comparison"]);
  assert.ok(disclosure);
  disclosure.props.onToggle({ currentTarget: { open: true } });
  const mounted = h.nodes().find((n) => n.type === h.AccountHistory);
  assert.ok(mounted);
  assert.notEqual(mounted.props.readOnly, true);
  assert.equal(mounted.key, "3");
  h.resource.data = { rows: [row], revision: 4 };
  assert.equal(h.nodes().find((n) => n.type === h.AccountHistory).key, "4");
  h.flags.demo = true;
  assert.equal(
    h.nodes().some((n) => n.type === h.AccountHistory),
    false,
  );
});
test("unsaved import suppresses mounted comparison and empty saved ledgers do not show build controls", async () => {
  const h = harness();
  h.nodes()
    .find((n) => n.type === "details" && n.props["data-account-comparison"])
    .props.onToggle({ currentTarget: { open: true } });
  const upload = h
    .nodes()
    .find((n) => n.type === "input" && n.props.type === "file");
  await upload.props.onChange({
    target: {
      files: [
        {
          size: 300,
          text: async () =>
            "id,account,date,type,symbol,quantity,price,amount,fee,currency\nadded,Main,2026-01-05,deposit,,0,0,20,0,USD",
        },
      ],
    },
  });
  assert.equal(
    h.nodes().some((n) => n.type === h.AccountHistory),
    false,
  );
  const empty = harness();
  empty.resource.data = { rows: [], revision: 1 };
  assert.equal(
    empty.nodes().some((n) => n.props["data-account-comparison"]),
    false,
  );
});
test("cash-event valuation algorithm invalidates pre-fix saved result version", () => {
  assert.notEqual(HISTORY_JOB_VERSION, "raw-ledger-v1");
});
