import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { demoData } from "./fixtures/demo.ts";
import * as calendar from "../lib/earnings-calendar.ts";
import * as review from "../lib/earnings-review.ts";
import * as format from "../lib/format.ts";
import * as decision from "../lib/decision-research.ts";
const code = ts.transpileModule(
  fs.readFileSync("components/EarningsReview.tsx", "utf8"),
  {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  },
).outputText;
const dependencies = {
  "react/jsx-runtime": jsx,
  "@/lib/earnings-calendar": calendar,
  "@/lib/earnings-review": review,
  "@/lib/format": format,
  "@/lib/financial-catalog": { researchPeriods: () => [] },
  "./Ui": { Source: () => null },
  "@/lib/decision-research": decision,
};
const mod = { exports: {} };
new Function("require", "module", "exports", code)(
  (name) => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  },
  mod,
  mod.exports,
);
test("earnings snapshot checks upcoming dates against the supplied display clock", () => {
  const r = {
    ...structuredClone(demoData.research.MSFT),
    retrievedAt: "2026-11-08T12:00:00Z",
    evidence: {
      updatedAt: "2026-11-08",
      earnings: [{ date: "2026-12-15", actual: null }],
    },
  };
  const render = (now) =>
    renderToStaticMarkup(
      React.createElement(mod.exports.default, {
        research: r,
        now: Date.parse(now),
      }),
    );
  assert.match(render("2026-11-08T12:00:00Z"), /Next report/);
  assert.doesNotMatch(render("2026-12-10T12:00:00Z"), /Next report/);
});
