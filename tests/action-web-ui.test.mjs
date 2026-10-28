import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { compareDca } from "../lib/planning.ts";
import { demoData } from "./fixtures/demo.ts";
import * as format from "../lib/format.ts";
import { renderToStaticMarkup } from "react-dom/server";
import {
  pacePresentation,
  contributionGuide,
  pacePeriods,
  PACE_LEVELS,
  PACE_DESCRIPTIONS,
} from "../lib/pace-presentation.ts";
function component(file, name, bindings = {}) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const node = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const js = ts.transpileModule(
    node.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  return new Function(
    "React",
    ...Object.keys(bindings),
    js + ";return " + name,
  )(React, ...Object.values(bindings));
}
const Readings = component("components/PaceReadings.tsx", "PaceReadings", {
  dateLabel: (x) => x,
});
const Guidance = component("components/PaceGuidance.tsx", "PaceGuidance", {
  dateLabel: (x) => x,
  PaceReadings: Readings,
  contributionGuide,
});
const show = (action, confirmed, forming) =>
  renderToStaticMarkup(
    React.createElement(Guidance, {
      view: pacePresentation(action, confirmed),
      readings: pacePeriods({
        multiplier: confirmed,
        date: "2026-09-30",
        forming: { multiplier: forming, date: "2026-10-26" },
      }),
    }),
  );
test("Pace exposes both periods without a click and applies only the confirmed level", () => {
  const html = show("Buy", 2, 4);
  assert.match(html, /Buy small/);
  assert.match(html, /pace-effective">P2/);
  const visible = html.replace(/<details[\s\S]*?<\/details>/g, "");
  assert.match(visible, /P4/);
  assert.match(visible, /P2/);
  assert.match(visible, /forming/);
  assert.match(visible, /confirmed/);
  assert.match(visible, /Deep zone/);
  assert.match(visible, /Initial zone/);
  assert.match(visible, /2026-09-30/);
  assert.match(visible, /2026-10-26/);
  assert.match(html, /1× your planned contribution/);
  assert.match(html, /Example: a \$100 plan means \$100/);
});
test("hold and risk actions keep the price Pace visible without authorising additions", () => {
  for (const action of ["Hold", "Wait", "Review", "Reduce", "Sell", "Avoid"]) {
    const html = show(action, 4, 2);
    assert.doesNotMatch(html, /pace-effective/);
    const visible = html.replace(/<details[\s\S]*?<\/details>/g, "");
    assert.match(visible, /P4/);
    assert.match(visible, /P2/);
    assert.match(html, new RegExp(action));
  }
});
test("public Pace education separates business quality, price history and incomplete assessments", () => {
  const Education = component(
    "components/PublicEducation.tsx",
    "PublicEducation",
    {
      Link: ({ href, children }) =>
        React.createElement("a", { href }, children),
      ArrowRight: () => null,
      ArrowUpRight: () => null,
      PrivacyChoices: () => null,
      SUPPORT_EMAIL: "support@auryninvest.com",
      PACE_LEVELS,
      PACE_DESCRIPTIONS,
      PACE_DESCRIPTIONS,
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(Education, { pace: true }),
  );
  assert.match(html, /business first/i);
  assert.match(html, /Buy small · P2/);
  assert.doesNotMatch(html, /Buy gradually · P2/);
  assert.match(html, /shows Review/);
  assert.match(html, /not a company-quality rating/);
  assert.match(html, /budget/);
  assert.doesNotMatch(html, /incomplete, it shows Wait/);
});
test("missing monthly history shows one explanation with no duplicate Pending tiles", () => {
  const html = show("Buy", null, null);
  assert.doesNotMatch(html, /Pending|pace-period|<details/);
  assert.equal(
    (html.match(/needs more completed price history/g) || []).length,
    1,
  );
  assert.match(html, /Buy gradually/);
});
test("a reading keeps its calculation reason with the visible confirmed Pace", () => {
  const html = renderToStaticMarkup(
    React.createElement(Guidance, {
      view: pacePresentation("Wait", 2),
      readings: pacePeriods({
        multiplier: 2,
        date: "2026-09-30",
        reason: "12% below the prior average.",
      }),
    }),
  );
  assert.match(html, /12% below the prior average/);
});

test("Strategy Lab visibly distinguishes its P1-spending legacy simulation from current Pace decisions", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.history = r.history.map((row) => ({
    ...row,
    open: 100,
    high: 100,
    low: 100,
    close: 100,
  }));
  const result = compareDca(r.history, r.retrievedAt, 10);
  assert.ok(result.history.length > 0);
  assert.ok(result.history.every((row) => row.multiplier === 1));
  assert.ok(result.adaptive.units > 0, "legacy P1 actually spends the deposit");
  const states = ["MSFT", 10, r, false, ""];
  let index = 0;
  const empty = () => null;
  const Lab = component("components/ResearchLab.tsx", "ResearchLab", {
    ...format,
    useState: () => [states[index++], empty],
    useMemo: (f) => f(),
    useProduct: () => ({}),
    compareDca,
    PaceHelp: empty,
    PageHeading: ({ title, subtitle }) =>
      React.createElement("header", null, title, subtitle),
    Notice: empty,
    Empty: empty,
    Help: empty,
    MiniChart: empty,
    FlaskConical: empty,
    Download: empty,
  });
  const html = renderToStaticMarkup(React.createElement(Lab));
  assert.match(html, /Legacy price-only policy/);
  assert.match(html, /does not implement current P1 Watch\/Hold/);
  assert.match(html, /historical business checks/);
  assert.doesNotMatch(html, />AURYN Pace<|AURYN Pace model/);
});
