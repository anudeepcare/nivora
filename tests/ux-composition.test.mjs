import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { demoData } from "./fixtures/demo.ts";
import * as outlook from "../lib/outlook.ts";
import * as decisions from "../lib/auryn-decision.ts";
import * as desks from "../lib/research-desks.ts";
import * as assessment from "../lib/model-assessment.ts";
import * as format from "../lib/format.ts";

function valueStudio() {
  const code = ts.transpileModule(
    fs.readFileSync("components/ValueStudio.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const marker = (name) => ({
    __esModule: true,
    default: () => React.createElement("p", { "data-view": name }, name),
  });
  const dependencies = {
    react: React,
    "react/jsx-runtime": jsx,
    "@/lib/outlook": outlook,
    "@/lib/auryn-decision": decisions,
    "@/lib/research-desks": desks,
    "@/lib/model-assessment": assessment,
    "@/lib/format": format,
    "./ValueStudio.module.css": {scenarios:"scenarios",consensus:"consensus",calculator:"calculator",market:"market",multipleRows:"multipleRows",multipleTrack:"multipleTrack"},
    "./DetailDialog": {__esModule:true,default:({title,trigger,children})=>React.createElement("section",{"data-detail-title":title}, React.createElement("button",{"aria-haspopup":"dialog"},trigger),children)},
    "./DecisionInsights": marker("calculator"),
    "./AnalystTargets": marker("analyst-targets"),
    "./StockPillars": marker("selected-cases"),
    "./ScenarioLenses": marker("scenario-methods"),
    "./SectionIcon": marker("icon"),
    "./Ui": { Help: ({trigger,children}) => React.createElement("span", null, trigger, children) },
    "./PriceProjection": marker("manual"),
    "./TargetsEstimates": marker("estimate-scenarios"),
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
  return mod.exports.default;
}
function research(consensus) {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = {
    ...r.evidence,
    updatedAt: r.retrievedAt,
    consensus: { ...consensus, currency: "USD" },
  };
  return r;
}
test("Valuation renders a complete analyst range once rather than repeating it beside itself", () => {
  const View = valueStudio();
  const html = renderToStaticMarkup(
    React.createElement(View, {
      research: research({ low: 80, target: 120, high: 160 }),
      onWorkbench: () => {},
    }),
  );
  assert.match(html, /selected-cases/);
  assert.doesNotMatch(html, /data-view="analyst-targets"/);
  assert.match(html, /scenario-methods/);
});
test("Valuation preserves a consensus-only observation when analyst bounds are missing", () => {
  const View = valueStudio();
  const html = renderToStaticMarkup(
    React.createElement(View, {
      research: research({ target: 120 }),
      onWorkbench: () => {},
    }),
  );
  assert.match(html, /data-view="analyst-targets"/);
});
test("Home companies precede saved reviews without a duplicated comparison banner", () => {
  const source = fs.readFileSync("components/HomeWorkspace.tsx", "utf8");
  assert.ok(
    source.indexOf("<HomeMarketCards") < source.indexOf("<ResearchInbox"),
  );
});
test("conditional scenario controls do not claim every default result has a three-year horizon", () => {
  const source = fs.readFileSync("components/TargetsEstimates.tsx", "utf8");
  assert.doesNotMatch(source, /<dd>Nearest eligible 3-year<\/dd>/);
});

test("compact portfolio snapshot retains every value and explanation without separate cards", async () => {
  const code = ts.transpileModule(
    fs.readFileSync("components/QuickRead.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const icons = await import("lucide-react");
  const modules = {
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "./QuickRead.module.css": { root: "root", compact: "compact" },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => modules[name],
    mod,
    mod.exports,
  );
  const html = renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      compact: true,
      title: "Portfolio snapshot",
      items: [
        {
          label: "Price coverage",
          value: "2 holdings need a price",
          detail: "Prices are snapshots.",
        },
        {
          label: "Largest position",
          value: "TEST · 12%",
          detail: "Excludes cash.",
        },
      ],
    }),
  );
  assert.match(html, /class="root compact"/);
  for (const text of [
    "2 holdings need a price",
    "Prices are snapshots.",
    "TEST · 12%",
    "Excludes cash.",
  ])
    assert.ok(html.includes(text), text);
});

test("optional Overview sections do not reserve empty named grid rows", () => {
  const css = fs.readFileSync("components/ResearchOverview.module.css", "utf8");
  assert.doesNotMatch(css, /grid-template-areas/);
  assert.match(css, /\.changes:empty\s*\{\s*display:\s*none/);
});


test("Valuation pairs cases and consensus with actual ratio values, not incomparable bar lengths", () => {
 const View=valueStudio(), r=research({target:120});
 r.evidence.multiples={TrailingPE:40,ForwardPE:20,PriceBookMRQ:5};
 const html=renderToStaticMarkup(React.createElement(View,{research:r}));
 assert.match(html, /class="scenarios"[\s\S]*?selected-cases[\s\S]*?class="consensus"[\s\S]*?analyst-targets/);
 assert.match(html, /data-metric="trailingPE"/);assert.match(html,/40.0×/);assert.match(html,/20.0×/);
 assert.doesNotMatch(html,/width:[0-9.]+%/);
 assert.match(html,/Earnings yield/);
 const source=fs.readFileSync("components/ValueStudio.tsx","utf8");assert.match(source,/<summary>Build your own price projection<\/summary>/);assert.match(source,/projectionOpened &&/);
 assert.match(source,/<DetailDialog[\s\S]*?title="Model fit &amp; evidence"|title="Model fit & evidence"/);
});
