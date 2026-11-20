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
    "SentiSensePanels",
  ])
    assert.match(ownership, new RegExp("<" + component + "[ \\n]"));
  assert.ok(
    ownership.indexOf("<SentiSensePanels") <
      ownership.indexOf("<ResearchWorkspace"),
  );
  assert.match(ownership, /Additional ownership evidence/);
  const panels = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  const officials = fs.readFileSync(
    "components/PublicOfficialsEvidence.tsx",
    "utf8",
  );
  assert.match(
    panels,
    /dataset === "politicians" \? \([\s\S]*?<PublicOfficialsEvidence/,
  );
  assert.match(officials, /congress\?symbol=/);
  assert.match(officials, /dataset=politicians/);
  assert.match(officials, /href: r.filingUrl/);
});
test("Pace preserves readings, chart, levels and historical tools with rules consolidated", () => {
  const s = fs.readFileSync("components/AccumulationDesk.tsx", "utf8");
  for (const component of ["PaceReadings", "PriceChart", "PaceHistoryInsights"])
    assert.match(s, new RegExp("<" + component + "[ \\n]"));
  assert.match(s, /<details(?: open)? className=\{detail.levels\}>/);
  assert.match(s, /<summary>Conditional zone prices<\/summary>/);
  assert.match(s, /amount\(l.price, r.quote.currency\)/);
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
  assert.match(options, /Company positioning/);
  assert.doesNotMatch(options, /Market overview|OptionsMarketOverview/);
  assert.match(
    fs.readFileSync("components/OptionsMarketPage.tsx", "utf8"),
    /<OptionsMarketOverview/,
  );
  for (const name of ["SentiSensePanels", "OptionsDesk"])
    assert.match(options, new RegExp("<" + name + "[ \\n]"));
  assert.doesNotMatch(options, /<details/);
  const analysts = section("Analysts", "Financials");
  for (const name of ["SentiSensePanels", "TargetsEstimates", "AnalystRatings"])
    assert.match(analysts, new RegExp("<" + name + "[ \\n]"));
  assert.doesNotMatch(analysts, /not merged with the consensus feed/);
  const evidence = fs.readFileSync("components/TargetsEstimates.tsx", "utf8");
  assert.match(
    evidence,
    /Sources &amp; reporting periods[\s\S]*not merged with the\s+consensus\s+feed/,
  );
  const business = section("Financials", "Valuation");
  for (const name of ["Financials", "BusinessHistory", "FinancingContext"])
    assert.match(business, new RegExp("<" + name + "[ \\n]"));
  assert.ok(
    business.indexOf("<Financials") < business.indexOf("Operating history"),
  );
});

test("optional market tools mount neither dataset until explicit selection", () => {
  let state;
  const hooks = {
    useId: () => "optional",
    useState: (value) => [
      state === undefined ? (state = value) : state,
      (value) => {
        state = value;
      },
    ],
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("components/ResearchWorkspace.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", code)(
    (name) => (name === "react" ? hooks : jsx),
    mod,
    mod.exports,
  );
  const views = [
    { title: "Market", content: "market-dataset" },
    { title: "Practice", content: "practice-tool" },
  ];
  const render = () =>
    mod.exports.default({
      label: "Optional tools",
      views,
      initialSelection: -1,
    });
  let tree = render();
  assert.equal(tree.props.children[1].props.children, undefined);
  tree.props.children[0].props.children[0].props.onClick();
  tree = render();
  assert.equal(tree.props.children[1].props.children, "market-dataset");
  assert.match(
    fs.readFileSync("components/Research.tsx", "utf8"),
    /label="Options research"/,
  );
});

test("Options tools sit above evidence and mount only the selected workspace", () => {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  const options = source.slice(
    source.indexOf('{tab === "Options" && ('),
    source.indexOf('{tab === "Analysts" && ('),
  );
  assert.ok(
    options.indexOf("<ResearchWorkspace") <
      options.indexOf("<SentiSensePanels"),
  );
  assert.ok(
    options.indexOf('title: "Positioning & history"') <
      options.indexOf('title: "Chain, gamma & practice"'),
  );
  assert.doesNotMatch(options, /preserveState|initialSelection/);
});
