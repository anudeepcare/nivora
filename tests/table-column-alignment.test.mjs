import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
function table(rows) {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(
      fs.readFileSync("components/IntelligenceTable.tsx", "utf8"),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
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
        : { default: new Proxy({}, { get: (_, k) => k }) },
    m,
    m.exports,
  );
  return renderToStaticMarkup(
    React.createElement(m.exports.default, {
      rows,
      title: "Reported positions",
    }),
  );
}
test("headers and cells share numeric alignment; dates and descriptive text remain left aligned", () => {
  const html = table([
    {
      label: "Holder with long name",
      date: "2026-09-30",
      href: null,
      cells: [
        { label: "Shares", value: "29,739,760" },
        { label: "Category", value: "INDEX FUND" },
        { label: "Ownership", value: "13.16%" },
        { label: "Filed date", value: "2026-09-30" },
      ],
    },
    {
      label: "Second",
      date: null,
      href: null,
      cells: [
        { label: "Shares", value: "Not supplied" },
        { label: "Category", value: "BANK" },
        { label: "Ownership", value: "0%" },
      ],
    },
  ]);
  assert.match(html, /<th[^>]*data-numeric="true"[^>]*>Shares/);
  assert.match(html, /<td[^>]*data-numeric="true"[^>]*>29,739,760/);
  assert.match(html, /<th[^>]*data-numeric="false"[^>]*>Category/);
  assert.match(html, /<th[^>]*data-numeric="false"[^>]*>Filed date/);
  assert.match(html, /Not supplied/);
  assert.match(html, /0%/);
  assert.match(html, /2026-09-30/);
});
test("shared table styling overrides inherited alignment without breaking number strings", () => {
  const css = fs.readFileSync(
    "components/IntelligenceTable.module.css",
    "utf8",
  );
  assert.match(css, /text-align: left/);
  assert.match(css, /\[data-numeric="true"\]/);
  assert.match(css, /text-align: right/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
});
test("additional ownership uses scoped compact aggregates and accessible bounded table", () => {
  const s = fs.readFileSync("components/OwnershipPicture.tsx", "utf8");
  assert.match(s, /layout.aggregates/);
  assert.match(s, /aria-label="Reported ownership positions"/);
  assert.match(s, /tabIndex=\{0\}/);
  const css = fs.readFileSync("components/OwnershipPicture.module.css", "utf8");
  assert.match(css, /margin: 0/);
  assert.match(css, /max-height:/);
  assert.match(css, /nth-child\(n \+ 3\)/);
});
