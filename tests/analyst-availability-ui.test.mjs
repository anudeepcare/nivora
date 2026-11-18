import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function render(status, loading = false) {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    "React",
    ts.transpileModule(fs.readFileSync("components/Analyst.tsx", "utf8"), {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
  )(
    (n) =>
      n === "react"
        ? React
        : n === "./Session"
          ? {
              useProduct: () => ({ demo: null }),
              useResource: () => ({ data: status, loading, refresh: () => {} }),
            }
          : n === "./AskAurynQuestion"
            ? {
                default: () =>
                  React.createElement("textarea", { "data-ai-form": true }),
              }
            : n === "@/lib/analysis"
              ? { perspective: () => ({}) }
              : n === "@/lib/format"
                ? { dateLabel: (x) => x }
                : n === "@/lib/customer-language"
                  ? { customerText: (x) => x }
                  : {},
    m,
    m.exports,
    React,
  );
  return renderToStaticMarkup(
    React.createElement(m.exports.default, {
      compact: true,
      research: { company: { symbol: "ZETA" }, retrievedAt: "2026-11-18" },
    }),
  );
}
test("known disabled Ask shows capability and retry before offering an unusable question form", () => {
  const html = render({
    available: false,
    reason: "disabled",
    message: "AI generation is disabled in this deployment.",
  });
  assert.match(html, /AI generation is disabled/);
  assert.match(html, /Check AI availability/);
  assert.doesNotMatch(html, /data-ai-form/);
  assert.match(html, /Local evidence guide/);
});
test("ready capability retains chat and loading does not invite submission", () => {
  assert.match(render({ available: true }), /data-ai-form/);
  assert.doesNotMatch(render(undefined, true), /data-ai-form/);
  assert.match(render(undefined, true), /Checking AI availability/);
});
