import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { namedAnalysts } from "../lib/analyst-person.ts";
function render({
  slug = null,
  mode = "profile",
  offset = 0,
  result = null,
  error = null,
} = {}) {
  const file = "components/NamedAnalystProfiles.tsx";
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace("export default function", "function"))
    .join("\n");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  let state = 0,
    key;
  const Component = new Function(
    "React",
    "useState",
    "useResource",
    "namedAnalysts",
    "styles",
    code + ";return NamedAnalystProfiles;",
  )(
    React,
    () => [[slug, mode, offset][state++], () => {}],
    (url) => {
      key = url;
      return {
        data: { data: result, retrievedAt: "2026-11-18" },
        loading: false,
        error,
        refresh: () => {},
      };
    },
    namedAnalysts,
    {},
  );
  const data = {
    coverage: Array.from({ length: 2 }, (_, firm) => ({
      analysts: Array.from({ length: 100 }, (_, i) => ({
        name: `Analyst ${firm * 100 + i}`,
        slug: `analyst-${firm * 100 + i}`,
      })),
    })),
  };
  return {
    html: renderToStaticMarkup(React.createElement(Component, { data })),
    key,
  };
}
test("large analyst roster remains compact native selector and makes no initial request", () => {
  const { html, key } = render();
  assert.equal(key, null);
  assert.match(html, /<select/);
  assert.equal((html.match(/<option/g) || []).length, 201);
  assert.ok((html.match(/<button/g) || []).length < 5);
  assert.match(html, /200 linked analysts/);
});
test("named analyst errors offer scoped retry", () => {
  assert.match(
    render({ slug: "analyst-1", error: "Temporarily unavailable" }).html,
    /Retry selected analyst/,
  );
});
test("wrong mode or stale calls offset does not display mislabeled evidence", () => {
  const calls = {
    slug: "analyst-1",
    offset: 0,
    rows: [
      {
        date: "2026-11-17",
        ticker: "AAPL",
        firm: "STALE PAGE",
        target: null,
        adjustedTarget: null,
        price: null,
        title: null,
        url: null,
        publisher: null,
      },
    ],
    total: 100,
    preview: false,
    withheldPage: false,
  };
  assert.doesNotMatch(
    render({ slug: "analyst-1", mode: "calls", offset: 25, result: calls })
      .html,
    /STALE PAGE/,
  );
  assert.doesNotMatch(
    render({ slug: "analyst-1", mode: "profile", result: calls }).html,
    /STALE PAGE/,
  );
});
test("research dataset selectors use restrained theme-aware styling, not hard-coded aqua", () => {
  const css = fs.readFileSync("components/SentiSensePanels.module.css", "utf8");
  assert.doesNotMatch(css, /#79eadc/i);
  assert.match(css, /\.tabs\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(
    css,
    /\.tabs button\[aria-pressed="true"\]\s*\{[^}]*var\(--ink/s,
  );
});
test("analyst evidence subgroup has visible scoped pressed selection, not ARIA alone", () => {
  const source = fs.readFileSync("components/NamedAnalystProfiles.tsx", "utf8");
  assert.match(source, /auryn-detail-tabs/);
  assert.match(source, /aria-pressed=\{mode === "profile"\}/);
  assert.match(source, /aria-pressed=\{mode === "calls"\}/);
  const css = fs.readFileSync("app/core/reference-tabs.css", "utf8");
  assert.match(
    css,
    /\.auryn-detail-tabs[^{}]*\[aria-pressed="true"\][^{}]*\{[^}]*background:/s,
  );
  assert.match(css, /\.auryn-detail-tabs\s*\{[^}]*flex-wrap:\s*wrap/s);
});
