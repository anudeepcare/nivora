import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const read = (name) => fs.readFileSync(`components/${name}.tsx`, "utf8");
test("Analysts route mounts flattened targets pane and retains analyst access and provider evidence", () => {
  const view = read("Research");
  const analysts = view.slice(
    view.indexOf('{tab === "Analysts" &&'),
    view.indexOf('{tab === "Financials" &&'),
  );
  assert.ok(analysts.includes("<TargetsEstimates"));
  assert.ok(analysts.includes("providerEvidence="));
  assert.ok(analysts.includes('group="analysts"'));
  assert.doesNotMatch(
    analysts,
    /ResearchWorkspace|Estimates & model evidence|Consensus & revisions/,
  );
  assert.match(view, /Analysts: "analysts"/);
});
test("provider mode and all four model views share one tablist; only selected content renders", () => {
  const body = read("TargetsEstimates")
    .replace(/^(?:"use client";|import[^;]+;)\s*/gm, "")
    .replace("export default function", "function");
  const js = ts.transpileModule(body + "\nreturn TargetsEstimates;", {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const labels = [
    "Provider evidence",
    "Analyst targets",
    "Annual estimates",
    "Conditional valuation",
    "Historical price risk",
  ];
  for (const selected of [0, 1]) {
    let modelReads = 0;
    const fake = (name) => () => React.createElement("span", null, name);
    const component = new Function(
      "React",
      "styles",
      "useMemo",
      "useState",
      "targetsEstimates",
      "AnalystTargets",
      js,
    )(
      React,
      {},
      (fn) => fn(),
      (initial) => [typeof initial === "number" ? selected : initial, () => {}],
      () => {
        modelReads++;
        return { forecasts: [], estimates: [], forecast: null };
      },
      fake("TEST_MODEL_TARGET"),
    );
    const html = renderToStaticMarkup(
      React.createElement(component, {
        research: { company: { symbol: "TEST" } },
        providerEvidence: React.createElement("span", null, "TEST_PROVIDER"),
      }),
    );
    assert.equal((html.match(/role="tablist"/g) || []).length, 1);
    assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
    const controls = [
      ...html.matchAll(/aria-controls="(auryn-targets-TEST-panel-(\d+))"/g),
    ];
    assert.equal(controls.length, labels.length);
    for (const [, panel, index] of controls) {
      const wrapper = `role="tabpanel" id="${panel}" aria-labelledby="auryn-targets-TEST-tab-${index}"`;
      assert.ok(
        html.includes(wrapper),
        `aria-controls needs a real panel: ${panel}`,
      );
      if (Number(index) !== selected)
        assert.ok(html.includes(`${wrapper} hidden=""></div>`));
    }

    for (const label of labels) assert.ok(html.includes(label), label);
    assert.equal(modelReads, selected === 0 ? 0 : 1);
    assert.equal(html.includes("TEST_PROVIDER"), selected === 0);
    assert.equal(html.includes("TEST_MODEL_TARGET"), selected === 1);
  }
});
