import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";
function render() {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(
      fs.readFileSync("components/OwnershipPicture.tsx", "utf8"),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
        },
      },
    ).outputText,
  )(
    (n) =>
      n === "react/jsx-runtime"
        ? jsx
        : n === "@/lib/format"
          ? format
          : {
              Help: ({ children }) =>
                React.createElement("span", null, children),
            },
    m,
    m.exports,
  );
  return renderToStaticMarkup(
    React.createElement(m.exports.default, {
      sourceRecords: true,
      research: {
        evidence: {
          source: "EODHD",
          updatedAt: "2026-11-18",
          ownership: { institutions: 60, insiders: 5 },
          holders: [
            {
              name: "Fund X",
              date: "2026-06-30",
              shares: 1234,
              percent: 10,
              change: 2,
            },
          ],
        },
      },
    }),
  );
}
test("supplemental ownership preserves dated distinct records but no competing current summary", () => {
  const html = render();
  assert.match(html, /Additional source records/);
  assert.match(html, /EODHD/);
  assert.match(html, /Fund X/);
  assert.match(html, /1,234/);
  assert.match(html, /2026/);
  assert.match(html, /Aggregate reporting date not supplied/);
  assert.doesNotMatch(html, /Largest supplied holder|Who holds the shares/);
});
test("Research consolidates ownership into Institutions instead of duplicate workspace headline", () => {
  const page = fs.readFileSync("components/Research.tsx", "utf8"),
    panels = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  assert.doesNotMatch(page, /title: "Reported ownership"/);
  assert.match(page, /supplementalOwnership=\{r\}/);
  assert.match(panels, /dataset === "holders" && supplementalOwnership/);
});
