import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
function render(status, loading = false, compact = true) {
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
        : n === "lucide-react"
          ? icons
          : n === "./Session"
            ? {
                useProduct: () => ({ demo: null }),
                useResource: () => ({
                  data: status,
                  loading,
                  refresh: () => {},
                }),
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
      compact,
      research: {
        company: { symbol: "ZETA" },
        facts: [],
        retrievedAt: "2026-11-18",
      },
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
  for (const compact of [true, false]) {
    const available = render({ available: true }, false, compact);
    assert.equal((available.match(/data-ai-form/g) || []).length, 1);
    assert.doesNotMatch(available, /Check AI availability/);
    assert.doesNotMatch(
      render({ available: false }, false, compact),
      /data-ai-form/,
    );
  }
  assert.doesNotMatch(render(undefined, true), /data-ai-form/);
  assert.match(render(undefined, true), /Checking AI availability/);
});
test("disabled Ask groups working evidence actions in one strip and labels retrieval date honestly", () => {
  const html = render({
    available: false,
    reason: "disabled",
    message:
      "AI generation is disabled in this deployment. Reported financial evidence remains available.",
  });
  assert.match(html, /class="ask-evidence-strip"/);
  assert.match(html, /role="group" aria-label="Local evidence guide"/);
  assert.match(html, /Loaded <time dateTime="2026-11-18">2026-11-18<\/time>/);
  assert.doesNotMatch(
    html,
    /Evidence through|Prepared explanations|Answers use|Reported financial evidence remains available/,
  );
  for (const action of [
    "Cash after capex",
    "Evidence gaps",
    "Strengthen the bull case",
    "Challenge the case",
  ])
    assert.match(html, new RegExp(">" + action + "</button>"));
});
