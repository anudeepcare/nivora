import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  storyListView,
  storyDetailView,
} from "../lib/sentisense-stories-view.ts";
test("story details load only after an explicit open and source URLs render safely", () => {
  const ast = ts.createSourceFile(
      "stories.tsx",
      fs.readFileSync("components/SentiSenseStories.tsx", "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    body = ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    code = ts.transpileModule(body, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    }).outputText;
  let selected = null;
  const calls = [];
  const b = {
    React,
    storyListView,
    storyDetailView,
    useState: () => [
      selected,
      (v) => {
        selected = v;
      },
    ],
    s: new Proxy({}, { get: (_, k) => k }),
    useResource: (key) => {
      if (key) calls.push(key);
      return {
        loading: false,
        data: key?.startsWith("stories/")
          ? {
              status: "available",
              data: {
                id: "story1",
                title: "<script>bad</script>",
                narrativeBody: "Narrative [doc1]",
                citationLinks: {
                  doc1: "https://example.com/source",
                  doc2: "javascript:alert(1)",
                },
                bullishView: "",
                bearishView: "",
              },
            }
          : {
              status: "available",
              data: [
                {
                  id: "story1",
                  tickers: ["AAPL"],
                  cluster: {
                    title: "Provider story",
                    storySource: "AI",
                    clusteredAt: 1794873600,
                  },
                },
              ],
            },
      };
    },
  };
  const Component = new Function(
    ...Object.keys(b),
    code + ";return SentiSenseStories;",
  )(...Object.values(b));
  const html = renderToStaticMarkup(
    React.createElement(Component, { symbol: "AAPL" }),
  );
  assert.match(html, /Provider story/);
  assert.ok(calls.every((k) => !k.startsWith("stories/")));
  const tree = Component({ symbol: "AAPL" });
  function find(v) {
    if (!v || typeof v !== "object") return null;
    if (v.type === "button") return v;
    for (const child of React.Children.toArray(v.props?.children)) {
      const result = find(child);
      if (result) return result;
    }
    return null;
  }
  find(tree).props.onClick();
  const detail = renderToStaticMarkup(
    React.createElement(Component, { symbol: "AAPL" }),
  );
  assert.ok(calls.includes("stories/AAPL/story1"));
  assert.match(detail, /https:\/\/example.com\/source/);
  assert.doesNotMatch(detail, /javascript:|<script>/);
  assert.match(detail, /No bullish case supplied/);
});
