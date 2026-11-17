import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
test("long news and filing lists keep every supplied row in keyboard-accessible bounded regions", () => {
  const ast = ts.createSourceFile(
    "research.tsx",
    fs.readFileSync("components/ResearchEvidence.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "NewsAndFilings",
  );
  const code = ts.transpileModule(fn.getText(ast).replace(/^export /, ""), {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const bindings = {
    React,
    useMemo: React.useMemo,
    useProduct: () => ({}),
    useResource: (key) => ({
      data: key.startsWith("news?")
        ? {
            items: Array.from({ length: 23 }, (_, i) => ({
              url: `https://example.com/news/${i}`,
              title: `Article ${i}`,
              date: "2026-11-17",
            })),
          }
        : {
            filings: Array.from({ length: 17 }, (_, i) => ({
              url: `https://example.com/filing/${i}`,
              form: "10-Q",
              title: `Filing ${i}`,
              date: "2026-11-17",
            })),
          },
    }),
    evidenceScroll: { region: "evidence-scroll" },
    dateLabel: (v) => v,
    ArrowUpRight: () => null,
    FileText: () => null,
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return NewsAndFilings;",
  )(...Object.values(bindings));
  const html = renderToStaticMarkup(
    React.createElement(View, {
      research: {
        company: { symbol: "AAPL", assetType: "stock" },
        retrievedAt: "2026-11-17",
        filings: [],
      },
    }),
  );
  assert.equal((html.match(/class="source-row"/g) || []).length, 40);
  assert.match(html, /23 articles/);
  assert.match(html, /Article 22/);
  assert.match(html, /Filing 16/);
  assert.equal((html.match(/tabindex="0" role="region"/g) || []).length, 2);
  const css = fs.readFileSync("components/EvidenceScroll.module.css", "utf8");
  assert.match(css, /max-height:/);
  assert.match(css, /overflow: auto/);
  assert.doesNotMatch(css, /position: fixed|overflow: hidden/);
});
