import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
test("research workspace mounts only chosen evidence and buttons switch actual content", () => {
  let state = 0;
  const hooks = {
    useId: () => "workspace",
    useState: () => [
      state,
      (value) => {
        state = value;
      },
    ],
  };
  const mod = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync("components/ResearchWorkspace.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", source)(
    (name) => (name === "react" ? hooks : jsx),
    mod,
    mod.exports,
  );
  const views = [
    { title: "Calendar", content: "dated-calendar" },
    { title: "Earnings", content: "actual-eps" },
  ];
  const render = () => mod.exports.default({ label: "Events", views });
  let tree = render();
  assert.equal(tree.props.children[1].props.children, "dated-calendar");
  tree.props.children[0].props.children[1].props.onClick();
  tree = render();
  assert.equal(tree.props.children[1].props.children, "actual-eps");
  assert.equal(
    tree.props.children[0].props.children[1].props["aria-pressed"],
    true,
  );
  assert.equal(
    tree.props.children[0].props.children[0].props["aria-pressed"],
    false,
  );
  const preserved = mod.exports.default({
    label: "Tools",
    views,
    preserveState: true,
  }).props.children[1].props.children;
  assert.equal(preserved.length, 2);
  assert.equal(preserved[0].props.hidden, true);
  assert.equal(preserved[1].props.hidden, false);
  assert.equal(preserved[0].props.children, "dated-calendar");
});
test("Ownership retains unique evidence and controls without duplicated investment-case rendering", () => {
  const s = fs.readFileSync("components/Research.tsx", "utf8");
  const ownership = s.slice(
    s.indexOf('{tab === "Thesis" && ('),
    s.indexOf("</FeatureGate>", s.indexOf('{tab === "Thesis" && (')),
  );
  assert.doesNotMatch(ownership, /<ThesisPicture|<details/);
  for (const component of [
    "OwnershipPicture",
    "BusinessMap",
    "Analyst",
    "DecisionWatch",
    "DecisionWorkspace",
    "CongressDisclosures",
    "SentiSensePanels",
  ])
    assert.match(ownership, new RegExp("<" + component + "[ \\n]"));
  assert.ok(
    ownership.indexOf("<SentiSensePanels") <
      ownership.indexOf("<ResearchWorkspace"),
  );
  assert.match(ownership, /Additional ownership evidence/);
});
test("Pace preserves readings, chart, levels and historical tools with rules consolidated", () => {
  const s = fs.readFileSync("components/AccumulationDesk.tsx", "utf8");
  for (const component of ["PaceReadings", "PriceChart", "PaceHistoryInsights"])
    assert.match(s, new RegExp("<" + component + "[ \\n]"));
  assert.match(s, /candidate-levels/);
  assert.match(s, /View legacy-policy backtest/);
  const summary = s.slice(
    s.indexOf('<div className="accumulation-summary">'),
    s.indexOf("{signal?.trimReview"),
  );
  assert.doesNotMatch(summary, /<h3>|P means Pace/);
  assert.ok(
    s.indexOf("P means Pace") > s.indexOf('<details className="policy-rules">'),
  );
});
test("Options, analyst sources and Business retain default evidence and unique secondary tools", () => {
  const s = fs.readFileSync("components/Research.tsx", "utf8");
  const section = (name, end) =>
    s.slice(
      s.indexOf(`{tab === "${name}" && (`),
      s.indexOf(`{tab === "${end}" && (`),
    );
  const options = section("Options", "Analysts");
  assert.ok(
    options.indexOf("Company positioning") < options.indexOf("Market overview"),
  );
  for (const name of [
    "SentiSensePanels",
    "OptionsMarketOverview",
    "OptionsDesk",
  ])
    assert.match(options, new RegExp("<" + name + "[ \\n]"));
  assert.doesNotMatch(options, /<details/);
  const analysts = section("Analysts", "Financials");
  for (const name of ["SentiSensePanels", "TargetsEstimates", "AnalystRatings"])
    assert.match(analysts, new RegExp("<" + name + "[ \\n]"));
  assert.match(analysts, /not merged with the consensus feed/);
  const business = section("Financials", "Valuation");
  for (const name of ["Financials", "BusinessHistory", "FinancingContext"])
    assert.match(business, new RegExp("<" + name + "[ \\n]"));
  assert.ok(
    business.indexOf("Financial statements") <
      business.indexOf("Operating history"),
  );
});
