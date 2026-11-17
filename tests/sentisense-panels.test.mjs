import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { intelligenceView } from "../lib/sentisense-view.ts";
function loadTable() {
  const ast = ts.createSourceFile(
    "table.tsx",
    fs.readFileSync("components/IntelligenceTable.tsx", "utf8"),
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
  return new Function("React", "s", code + ";return IntelligenceTable;")(
    React,
    new Proxy({}, { get: (_, k) => k }),
  );
}
function harness(hiddenSignals = []) {
  const ast = ts.createSourceFile(
    "panels.tsx",
    fs.readFileSync("components/SentiSensePanels.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) =>
      n
        .getText(ast)
        .replace(/^export default /, "")
        .replace(/^export /, ""),
    )
    .join("\n");
  const code = ts.transpileModule(body, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  let selected;
  const requests = [];
  const bindings = {
    React,
    useWorkspacePreferences: () => ({ preferences: { hiddenSignals } }),
    Link: ({ children, ...props }) => React.createElement("a", props, children),
    useState: (initial) => [
      selected ?? initial,
      (value) => {
        selected = value;
      },
    ],
    intelligenceView,
    IntelligenceTable: loadTable(),
    s: new Proxy({}, { get: (_, key) => key }),
    SentiSenseConsensus: () =>
      React.createElement("p", null, "Analyst consensus"),
    useResource: (key) => {
      requests.push(key);
      return {
        loading: false,
        data: {
          status: "available",
          isPreview: false,
          retrievedAt: "2026-11-17T12:00:00Z",
          data: key.includes("insiders")
            ? [
                {
                  insiderName: "Director A",
                  transactionCode: "F",
                  sharesTransacted: 10,
                },
              ]
            : { holders: [{ filerName: "Fund A", shares: 200 }] },
        },
      };
    },
  };
  const Component = new Function(
    ...Object.keys(bindings),
    code + ";return SentiSensePanels;",
  )(...Object.values(bindings));
  return {
    Component,
    requests,
    render: (props) =>
      renderToStaticMarkup(React.createElement(Component, props)),
    click: (props, label) => {
      const tree = Component(props),
        nav = tree.props.children[1],
        button = nav.props.children.find(
          (child) => child.props.children === label,
        );
      assert.ok(button);
      button.props.onClick();
    },
  };
}
test("intelligence picker rerenders selected dataset, preserves labels and lazily fetches only its section", () => {
  const h = harness(),
    props = { symbol: "AAPL", group: "ownership" };
  const first = h.render(props);
  assert.match(first, /Fund A/);
  assert.equal(h.requests.length, 1);
  assert.match(h.requests[0], /dataset=holders/);
  h.click(props, "Insiders");
  const next = h.render(props);
  assert.match(next, /Director A/);
  assert.doesNotMatch(next, /Fund A/);
  assert.equal(h.requests.length, 2);
  assert.match(h.requests[1], /dataset=insiders/);
  assert.match(next, /aria-pressed="true">Insiders/);
});
test("demo does not make paid provider calls", () => {
  const h = harness();
  assert.equal(
    h.render({ symbol: "AAPL", group: "events", preview: true }),
    "",
  );
  assert.equal(h.requests.length, 0);
});

test("hidden evidence preferences remove providers without hiding restore control", () => {
  const h = harness(["options"]);
  const html = h.render({ symbol: "AAPL", group: "options" });
  assert.match(html, /Research panels hidden/);
  assert.match(html, /href="\/settings"/);
  assert.equal(h.requests.length, 0);
  const ownership = harness(["institutions", "congressional"]);
  const page = ownership.render({ symbol: "AAPL", group: "ownership" });
  assert.doesNotMatch(page, />Institutions<|>Public officials</);
  assert.match(ownership.requests[0], /dataset=insiders/);
});

test("shared evidence table keeps full source detail in disclosure without expanding every row", () => {
  const Table = loadTable();
  const citation = "Source evidence ".repeat(40);
  const html = renderToStaticMarkup(
    React.createElement(Table, {
      title: "Financials",
      rows: [
        {
          label: "Q3",
          date: "2026-09-30",
          href: null,
          cells: [
            { label: "Value", value: "0 USD" },
            { label: "Source citation", value: citation },
          ],
        },
      ],
    }),
  );
  assert.match(html, /<table/);
  assert.match(html, /scope="col">Value/);
  assert.match(html, /0 USD/);
  assert.match(html, /<details/);
  assert.match(html, /View source citation/);
  assert.ok(html.includes(citation));
  assert.doesNotMatch(html, /<details[^>]*open/);
});
