import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import postcss from "postcss";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { researchLenses } from "../lib/reference-navigation.ts";
import { demoData } from "./fixtures/demo.ts";
const property = (file, selector, name) => {
  let result;
  postcss
    .parse(fs.readFileSync(`components/${file}.module.css`, "utf8"))
    .walkRules((r) => {
      if (r.selector === selector && r.parent.type === "root")
        r.walkDecls(name, (d) => (result = d.value));
    });
  return result;
};
test("all non-Atlas research views recover the existing shared research inset", () => {
  assert.equal(
    property(
      "ResearchPlaid",
      ".root.root [data-research-section]:not([hidden])",
      "padding-inline",
    ),
    "var(--research-gutter)",
  );
});
test("scenario consensus and indicator cards align without nested borders", () => {
  assert.equal(
    property("ValueStudio", ".root.root.root > .consensus", "padding"),
    "clamp(14px, 1.5vw, 20px)",
  );
  assert.equal(
    property("ResearchLens", ".indicators .indicator", "display"),
    "flex",
  );
  assert.equal(
    property(
      "ResearchLens",
      ".indicators .indicator > .observations",
      "margin-top",
    ),
    "auto",
  );
});
test("ownership comparison ruler and rows share columns", () => {
  assert.equal(
    property("OwnershipEvidenceMap", ".root", "--ownership-columns"),
    "minmax(0, 24fr) minmax(0, 76fr) 5rem",
  );
  for (const selector of [".axis", ".row"])
    assert.equal(
      property("OwnershipEvidenceMap", selector, "grid-template-columns"),
      "var(--ownership-columns)",
    );
});

test("all eight shipped research controls SSR with a unique active section and matching destination", () => {
  const file = fs.readFileSync("components/Research.tsx", "utf8");
  const ast = ts.createSourceFile(
    "Research.tsx",
    file,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let nav;
  function walk(n) {
    if (
      ts.isJsxElement(n) &&
      n.openingElement.getText(ast).includes('aria-label="Research sections"')
    )
      nav = n;
    ts.forEachChild(n, walk);
  }
  walk(ast);
  assert.ok(nav);
  const js = ts.transpileModule("return " + nav.getText(ast), {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const render = new Function(
    "React",
    "cockpit",
    "researchNavigation",
    "availableLenses",
    "activeLens",
    "switchTab",
    "ResearchTabIcon",
    js,
  );
  assert.equal(researchLenses.length, 8);
  for (const activeLens of researchLenses) {
    const element = render(
      React,
      { lenses: "lenses" },
      null,
      researchLenses,
      activeLens,
      () => {},
      () => null,
    );
    const html = renderToStaticMarkup(element);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.equal((html.match(/<button /g) || []).length, 8);
    for (const lens of researchLenses) {
      const button = html.match(
        new RegExp(
          `<button data-section="${lens.sections[0]}"([^>]*)>${lens.label}</button>`,
        ),
      );
      assert.ok(button, lens.label);
      assert.match(
        button[1],
        new RegExp(
          `aria-controls="${lens.label === "Atlas" ? "research-overview" : "research-content"}"`,
        ),
      );
      assert.equal(
        button[1].includes('aria-current="page"'),
        lens === activeLens,
      );
    }
  }
});

test("populated Research routes open their actual top-level evidence branch", () => {
  const file = fs.readFileSync("components/Research.tsx", "utf8");
  const ast = ts.createSourceFile(
    "Research.tsx",
    file,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const regions = [];
  function walk(n) {
    if (
      ts.isJsxElement(n) &&
      /id="research-overview"|data-research-section=/.test(
        n.openingElement.getText(ast),
      )
    )
      regions.push(n);
    ts.forEachChild(n, walk);
  }
  walk(ast);
  assert.equal(regions.length, 2);
  const js = ts.transpileModule(
    "return <>" + regions.map((n) => n.getText(ast)).join("") + "</>",
    { compilerOptions: { jsx: ts.JsxEmit.React } },
  ).outputText;
  const paths = {
    Snapshot: "ReferenceAtlas",
    Valuation: "ValueStudio",
    Technicals: "TechnicalPicture",
    Thesis: "ownership",
    News: "EventsLens",
    Advanced: "IndicatorsLens",
    Pace: "DcaResearch",
    Options: "options",
    Financials: "Financials",
    Analysts: "analysts",
  };
  const ResearchWorkspace = ({ views }) => views[0].content;
  const FeatureGate = ({ children }) => children;
  const stub =
    (name) =>
    ({ research, symbol, group }) =>
      React.createElement("span", {
        "data-component": group ?? name,
        "data-seed": research?.company.symbol ?? symbol,
      });
  const components = Object.fromEntries(
    Object.values(paths)
      .filter((name) => /^[A-Z]/.test(name))
      .map((name) => [name, stub(name)]),
  );
  const noop = () => {};
  const styles = {
    root: "delegate",
    content: "inner",
    primaryChart: "primaryChart",
  };
  const r = demoData.research.MSFT;
  assert.ok(r.history.length);
  for (const [tab, component] of Object.entries(paths)) {
    const bindings = {
      React,
      tab,
      r,
      chart: null,
      cockpit: styles,
      tabVisuals: styles,
      deskLayout: styles,
      retainedCharts: [tab],
      switchTab: noop,
      demo: false,
      technicalsHidden: false,
      access: { features: { technicals: true } },
      tabPresentation: { [tab]: { label: tab } },
      ResearchWorkspace,
      FeatureGate,
      SentiSensePanels: stub("SentiSensePanels"),
      ...Object.fromEntries(
        [
          "FreeSnapshot",
          "TimingContext",
          "OptionsDesk",
          "TargetsEstimates",
          "AnalystRatings",
          "BusinessHistory",
          "FinancingContext",
          "BusinessMap",
          "Analyst",
          "DecisionWorkspace",
          "DecisionWatch",
          "ResearchNotes",
          "CompanyBrief",
        ].map((name) => [name, stub(name)]),
      ),
      ...components,
    };
    const render = new Function(...Object.keys(bindings), js);
    const html = renderToStaticMarkup(render(...Object.values(bindings)));
    assert.match(
      html,
      new RegExp(`data-component="${component}" data-seed="MSFT"`),
      tab,
    );
    assert.equal(
      (html.match(/data-component="/g) || []).length,
      tab === "Thesis" ? 3 : tab === "Financials" ? 2 : 1,
      tab,
    );
    assert.match(
      html,
      tab === "Snapshot"
        ? /<div id="research-overview">/
        : /id="research-overview" hidden=""/,
    );
  }
});
