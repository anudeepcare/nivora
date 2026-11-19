import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { cleanTransactions } from "../lib/transaction-ledger.ts";
function harness({ failAfterCommit = false } = {}) {
  const ast = ts.createSourceFile(
    "x.tsx",
    fs.readFileSync("components/TransactionWorkspace.tsx", "utf8"),
    99,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) =>
      ts.isFunctionDeclaration(n) && n.name?.text === "DirectTransactionRecord",
  );
  assert.ok(fn, "direct transaction form exists");
  const states = [];
  let cursor = 0;
  const calls = [];
  const resource = {
    data: { rows: [], revision: 4 },
    loading: false,
    refresh() {},
  };
  const flags = { demo: false };
  const refs = [];
  let refCursor = 0;
  let uuid = 0;
  const bindings = {
    React,
    cleanTransactions,
    useProduct: () => flags,
    useResource: () => resource,
    useRef: (value) => {
      const i = refCursor++;
      return (refs[i] ??= { current: value });
    },
    useState: (v) => {
      const i = cursor++;
      if (!(i in states)) states[i] = v;
      return [states[i], (v) => (states[i] = v)];
    },
    api: async (...args) => {
      calls.push(args);
      if (failAfterCommit) {
        resource.data = { rows: args[1].rows, revision: args[1].revision + 1 };
        throw Error("Response lost");
      }
    },
    s: {},
    crypto: { randomUUID: () => `new-id-${++uuid}` },
    FormData: class {
      constructor(form) {
        this.form = form;
      }
      get(k) {
        return this.form[k] ?? "";
      }
    },
  };
  const code = ts.transpileModule(fn.getText(ast), {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return DirectTransactionRecord",
  )(...Object.values(bindings));
  function nodes() {
    cursor = 0;
    refCursor = 0;
    const all = [];
    function walk(n) {
      if (!n || typeof n !== "object") return;
      all.push(n);
      React.Children.forEach(n.props?.children, walk);
    }
    walk(View({ initialSymbol: "TEST" }));
    return all;
  }
  async function submit(overrides = {}) {
    const form = nodes().find((n) => n.type === "form");
    await form.props.onSubmit({
      preventDefault() {},
      currentTarget: {
        account: "Main",
        date: "2026-01-02",
        type: "buy",
        symbol: "TEST",
        quantity: "1.5",
        price: "20",
        amount: "",
        fee: "0",
        ...overrides,
      },
    });
  }
  return { nodes, submit, calls, resource, flags };
}
test("direct form is immediately available, seeds ticker and appends a dated validated row with revision", async () => {
  const h = harness();
  assert.ok(
    h
      .nodes()
      .find(
        (n) =>
          n.type === "input" &&
          n.props.name === "symbol" &&
          n.props.defaultValue === "TEST",
      ),
  );
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][0], "transactions");
  assert.equal(h.calls[0][1].revision, 4);
  assert.equal(h.calls[0][1].rows[0].quantity, 1.5);
  await h.submit();
  assert.equal(h.calls.length, 1, "saved form cannot duplicate submission");
});
test("invalid trade, loading, storage failure and demo never save", async () => {
  for (const kind of ["invalid", "loading", "error", "demo"]) {
    const h = harness();
    if (kind === "loading") h.resource.loading = true;
    if (kind === "error") h.resource.error = "Unavailable";
    if (kind === "demo") h.flags.demo = true;
    await h.submit(kind === "invalid" ? { quantity: "0" } : {});
    assert.equal(h.calls.length, 0, kind);
  }
});
test("cash entry strips hidden trade fields and preserves existing rows", async () => {
  const h = harness();
  const old = {
    id: "old",
    account: "Main",
    date: "2026-01-01",
    type: "deposit",
    symbol: "",
    quantity: 0,
    price: 0,
    amount: 100,
    fee: 0,
    currency: "USD",
  };
  h.resource.data.rows = [old];
  await h.submit({ type: "deposit", amount: "50" });
  assert.deepEqual(h.calls[0][1].rows[0], old);
  assert.equal(h.calls[0][1].rows[1].symbol, "");
  assert.equal(h.calls[0][1].rows[1].quantity, 0);
});

test("committed response lost then ledger reload and retry cannot create a second transaction", async () => {
  const h = harness({ failAfterCommit: true });
  await h.submit();
  assert.equal(h.resource.data.rows.length, 1);
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.resource.data.rows.length, 1);
  assert.ok(
    h
      .nodes()
      .some(
        (n) =>
          n.props?.role === "status" &&
          String(n.props.children).includes("Transaction saved"),
      ),
  );
});
