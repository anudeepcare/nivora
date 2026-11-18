import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("public official alternate source is only mounted in selected dataset, not a competing side panel", () => {
  const page = fs.readFileSync("components/Research.tsx", "utf8");
  const panels = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  assert.doesNotMatch(page, /className=\{cockpit.ownershipGrid\}/);
  assert.doesNotMatch(page, /<CongressDisclosures/);
  assert.match(
    panels,
    /dataset === "politicians" \? \([\s\S]*?<PublicOfficialsEvidence/,
  );
});

test("active picker renders alternate filing source only for public officials and respects hidden preference", async () => {
  const ts = (await import("typescript")).default;
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const source = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  const ast = ts.createSourceFile(
    "x.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const nodes = ast.statements.filter(
    (n) =>
      (ts.isVariableStatement(n) &&
        n.getText(ast).startsWith("const groups")) ||
      (ts.isFunctionDeclaration(n) && n.name?.text === "SentiSensePanels"),
  );
  const code = ts.transpileModule(
    nodes.map((n) => n.getText(ast).replace("export default ", "")).join("\n"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  let selection = "holders",
    hidden = [];
  const bindings = {
    React,
    useState: (i) => [selection, () => {}],
    useWorkspacePreferences: () => ({ preferences: { hiddenSignals: hidden } }),
    s: new Proxy({}, { get: (_, k) => k }),
    Dataset: () => React.createElement("p", null, "Selected source"),
    PublicOfficialsEvidence: () => {
      mounts++;
      return React.createElement("p", null, "Distinct filing records");
    },
    PoliticianMembers: () => null,
    PoliticianActivity: () => null,
    navigateSelection: () => {},
  };
  const Panel = new Function(
    ...Object.keys(bindings),
    code + ";return SentiSensePanels",
  )(...Object.values(bindings));
  let mounts = 0;
  const Alternate = () => {
    mounts++;
    return React.createElement("p", null, "Distinct filing records");
  };
  const props = {
    symbol: "ZETA",
    group: "ownership",
    supplementalCongress: React.createElement(Alternate),
  };
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(Panel, props)),
    /Distinct filing records/,
  );
  assert.equal(mounts, 0);
  selection = "politicians";
  assert.match(
    renderToStaticMarkup(React.createElement(Panel, props)),
    /Distinct filing records/,
  );
  assert.equal(mounts, 1);
  hidden = ["congressional"];
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(Panel, props)),
    /Distinct filing records/,
  );
  assert.equal(mounts, 1);
});

test("combined officials provenance identifies both sources", () => {
  const panels = fs.readFileSync("components/SentiSensePanels.tsx", "utf8");
  assert.match(panels, /dataset === "politicians"[\s\S]*?SentiSense and EODHD/);
});
