import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const source = fs.readFileSync("components/Research.tsx", "utf8");
const ast = ts.createSourceFile(
  "Research.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const nodes = [];
function visit(n) {
  nodes.push(n);
  ts.forEachChild(n, visit);
}
visit(ast);
const notice = nodes.find(
  (n) =>
    ts.isJsxElement(n) &&
    n.openingElement.attributes.properties.some(
      (p) =>
        p.name?.getText(ast) === "className" &&
        p.initializer?.getText(ast) === "{cockpit.preferenceNotice}",
    ),
);
const compiled = ts.transpileModule("const view=" + notice.getText(ast), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
}).outputText;
const make = new Function(
  "React",
  "workspacePreferences",
  "cockpit",
  compiled + ";return view;",
);
test("hidden technicals exposes an actual working restoration control and save error", async () => {
  let saved;
  const preferences = {
    preferences: { hiddenSignals: ["technicals", "options"] },
    ready: true,
    saving: false,
    error: "Save unavailable",
    save: async (p) => {
      saved = p;
    },
  };
  const element = make(React, preferences, { preferenceNotice: "notice" });
  const html = renderToStaticMarkup(element);
  assert.match(html, /Technical indicators are hidden/);
  assert.match(html, /role="alert">Save unavailable/);
  const button = React.Children.toArray(element.props.children).find(
    (x) => x.type === "button",
  );
  assert.equal(button.props.disabled, false);
  await button.props.onClick();
  assert.deepEqual(saved, { hiddenSignals: ["options"] });
  const blocked = make(
    React,
    { ...preferences, saving: true },
    { preferenceNotice: "notice" },
  );
  assert.equal(
    React.Children.toArray(blocked.props.children).find(
      (x) => x.type === "button",
    ).props.disabled,
    true,
  );
});
test("active technical view renders independently of retained state but never bypasses entitlement or preference", () => {
  const match = source.match(
    /\{(access.features.technicals &&[\s\S]*?) && \(\s*<section\s*data-retained-panel="Technicals"/,
  );
  assert.ok(match);
  const show = new Function(
    "access",
    "technicalsHidden",
    "tab",
    "retainedCharts",
    "return " + match[1],
  );
  assert.equal(
    show({ features: { technicals: true } }, false, "Technicals", []),
    true,
  );
  assert.equal(
    show({ features: { technicals: false } }, false, "Technicals", []),
    false,
  );
  assert.equal(
    show({ features: { technicals: true } }, true, "Technicals", []),
    false,
  );
  assert.equal(
    show({ features: { technicals: true } }, false, "News", []),
    false,
  );
});
