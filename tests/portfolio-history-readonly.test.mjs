import { accountHistoryWindow } from "../lib/account-history-window.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const source = fs.readFileSync("components/AccountHistory.tsx", "utf8");
const ast = ts.createSourceFile(
  "x.tsx",
  source,
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
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  },
).outputText;
function render(result, period = "ALL", restoring = false) {
  let i = 0;
  const bindings = {
    accountHistoryWindow,
    React,
    useRef: (v) => ({ current: v }),
    useState: (v) => {
      const index = i++;
      return [
        index === 6
          ? result
          : index === 8
            ? restoring
            : index === 10
              ? period
              : v,
        () => {},
      ];
    },
    useEffect: () => {},
    styles: new Proxy({}, { get: (_, k) => k }),
    amount: String,
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return AccountHistory",
  )(...Object.values(bindings));
  return renderToStaticMarkup(
    View({ readOnly: true, onReviewRecords: () => {} }),
  );
}
test("portfolio hides missing history without recreating ledger review workflow", () => {
  assert.equal(render(null, "ALL", true), "");
  assert.doesNotMatch(render({ status: "unavailable", points: [] }), /<svg/);
  const page = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  assert.match(page, /<AccountHistory\s+readOnly/);
  assert.doesNotMatch(
    page,
    /Portfolio over time|Your portfolio in 30 seconds|reference.summaryDetails|Review recorded transactions/,
  );
  assert.match(page, /<PortfolioLedger/);
  assert.match(page, /<TransactionWorkspace/);
});
test("valid saved chart remains with benchmark meaning and without rebuild actions", () => {
  const html = render({
    status: "available",
    points: [
      { date: "2026-11-17", equity: 100, netContributions: 90, gain: 10 },
    ],
    benchmarks: [],
    revision: 1,
  });
  assert.match(html, /Account value &amp; market comparison/);
  assert.match(html, /Account equity and net contributions/);
  assert.doesNotMatch(
    html,
    /Review ledger|Build account history|Review saved revision|type="checkbox"/,
  );
});

test("date ranges clip actual saved observations without fabricating returns", () => {
  const result = {
    status: "available",
    points: [
      { date: "2026-01-02", equity: 90, netContributions: 90, gain: 0 },
      { date: "2026-11-17", equity: 100, netContributions: 90, gain: 10 },
    ],
    benchmarks: [],
  };
  const all = render(result, "ALL"),
    month = render(result, "1M");
  assert.match(all, /from 2026-01-02 to 2026-11-17/);
  assert.match(month, /from 2026-11-17 to 2026-11-17/);
  assert.match(month, /Inspect account history date/);
  assert.doesNotMatch(month, /14.8%|9.2%/);
});

test("missing or invalid history renders no panel or action", () => {
  for (const result of [
    null,
    { status: "unavailable", points: [], reason: "Incomplete ledger" },
    { status: "available", points: [] },
  ]) {
    assert.equal(render(result), "");
  }
});
test("holdings expose shares and cost by default with separate value and return columns", () => {
  const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  assert.match(
    source,
    /\[expandedMetrics, setExpandedMetrics\] = useState\(true\)/,
  );
  assert.match(source, /<th>Value<\/th>\s*<th>Return<\/th>/);
  assert.match(source, /!expandedMetrics &&/);
});
