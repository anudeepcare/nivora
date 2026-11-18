import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { ownershipLinks } from "../lib/research-visual-evidence.ts";
function render(values) {
  const m = { exports: {} };
  const js = ts.transpileModule(
    fs.readFileSync("components/OwnershipEvidenceMap.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", js)(
    (n) =>
      n === "react"
        ? React
        : n === "react/jsx-runtime"
          ? jsx
          : n === "lucide-react"
            ? { Building2: () => null }
            : n.endsWith(".css")
              ? new Proxy({}, { get: (_, k) => String(k) })
              : { ownershipLinks },
    m,
    m.exports,
  );
  return renderToStaticMarkup(
    React.createElement(m.exports.default, {
      symbol: "TEST",
      data: {
        ticker: "TEST",
        reportDate: "2026-09-30",
        holders: values.map((p, i) => ({
          filerName: `Holder ${i}`,
          pctOfClassOutstanding: p,
        })),
      },
    }),
  );
}
test("ownership chart compares reported share class percentages on one explicit scale", () => {
  const html = render([8, 4, 0, null]);
  assert.match(html, /Reported ownership comparison/);
  assert.match(html, /aria-valuemax="8"/);
  assert.match(html, /aria-valuenow="4"/);
  assert.match(html, /width:50%/);
  assert.match(html, /aria-valuenow="0"/);
  assert.equal((html.match(/role="meter"/g) || []).length, 3);
  assert.match(html, /2026-09-30/);
  assert.match(html, /not the full ownership universe/);
  assert.match(html, /Not supplied/);
});
test("missing or out of range ownership is not plotted, and all zero remains zero", () => {
  assert.doesNotMatch(render([null, -1, 101]), /role="meter"/);
  const html = render([0, 0]);
  assert.match(html, /width:0%/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
