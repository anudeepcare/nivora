import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (name) => fs.readFileSync(`components/${name}`, "utf8");

test("phone agenda resets event row placement inside its single column", () => {
  const root = postcss.parse(read("HomeWorkspace.module.css"));
  let reset = false;
  root.walkAtRules("media", (media) => {
    if (media.params !== "(max-width: 600px)") return;
    media.walkRules((rule) => {
      if (!rule.selector.endsWith(":global(.home-event-row)")) return;
      rule.walkDecls("grid-column", (declaration) => {
        if (declaration.value === "1 / -1") reset = true;
      });
    });
  });
  assert.ok(reset, "phone agenda rows must not create implicit column 2");
});

test("alerts distinguish initial loading and failed retrieval from empty lists", () => {
  const source = read("AlertCenter.tsx");
  assert.match(source, /rules\.loading && !rules\.data/);
  assert.match(source, /Loading alert rules/);
  assert.match(source, /rules\.error && !rules\.data/);
  assert.match(source, /events\.loading && !events\.data/);
  assert.match(source, /Loading alert history/);
  assert.match(source, /events\.error && !events\.data/);
});

test("mark-read controls cannot repeat a pending mutation", () => {
  assert.match(read("AlertCenter.tsx"), /aria-label="Mark alert read"\s+disabled=\{busy\}/);
});

test("discovery distinguishes an active scan and no verified results", () => {
  const source = read("Discover.tsx");
  assert.match(source, /busy && !rows\.length/);
  assert.match(source, /role="status">Reviewing company sources/);
  assert.match(source, /"No verified results yet"/);
});

test("holdings import explains preview restriction and clears cancelled feedback", () => {
  const source = read("HoldingsImport.tsx");
  assert.match(source, /demo && <p[^>]*>Sign in to confirm this import/);
  assert.match(source, /setRows\(\[\]\);\s+setMessage\("Import cancelled\."\)/);
});

import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
function alertMarkup(resource) {
  const module = { exports: {} };
  const modules = {
    react: React,
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "next/link": ({children, ...props}) => React.createElement("a", props, children),
    "next/navigation": { useSearchParams: () => new URLSearchParams() },
    "@/lib/client-id": { newRequestId: () => "test" },
    "@/lib/client": { api: () => { throw Error("No requests during render"); } },
    "@/lib/format": { dateLabel: (date) => date },
    "./Session": { useProduct: () => ({}), useResource: () => ({...resource, refresh: () => {}}) },
    "./Ui": {
      PageHeading: ({title, subtitle, action}) => React.createElement("header", null, title, subtitle, action),
      Notice: ({children}) => React.createElement("p", null, children),
      Empty: ({title, children}) => React.createElement("section", null, title, children),
    },
  };
  const code = ts.transpileModule(read("AlertCenter.tsx"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    assert.ok(name in modules, name);
    return modules[name];
  }, module, module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.default));
}
test("rendered alerts announce loading without claiming zero saved rules", () => {
  const html = alertMarkup({loading: true});
  assert.match(html, /Loading alert rules/);
  assert.match(html, /Loading alert history/);
  assert.doesNotMatch(html, /No alert rules yet|Nothing triggered yet/);
});
test("rendered alerts expose independent retries when retrieval fails", () => {
  const html = alertMarkup({loading: false, error: "Offline"});
  assert.match(html, /Retry rules/);
  assert.match(html, /Retry history/);
  assert.doesNotMatch(html, /No alert rules yet|Nothing triggered yet/);
});
test("rendered loaded empty alerts keep the onboarding guidance", () => {
  const html = alertMarkup({loading: false, data: {documents: [], events: []}});
  assert.match(html, /No alert rules yet/);
  assert.match(html, /Nothing triggered yet/);
});
