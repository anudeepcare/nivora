import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
import { cashFlowValue } from "../lib/engine.ts";
import { valuationScale } from "../lib/research-summary.ts";
const require = createRequire(import.meta.url);
// Execute the real valuation component and its button callback. The React hook
// transport records state updates; no DOM, provider or paid request is involved.
const source = fs.readFileSync(
  new URL("../components/Valuation.tsx", import.meta.url),
  "utf8",
);
const ast = ts.createSourceFile(
  "Valuation.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Valuation",
);
const code = ts.transpileModule(
  declaration.getText(ast).replace("export default ", ""),
  {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  },
).outputText;
function walk(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const found = walk(child, predicate);
    if (found) return found;
  }
  return null;
}
test("selecting the Bear scenario loads the exact assumptions behind its displayed estimate", () => {
  const updates = [];
  const useState = (v) => {
    const i = updates.length;
    updates.push(v);
    return [
      v,
      (x) => {
        updates[i] = x;
      },
    ];
  };
  const bear = {
    name: "Bear",
    growth: -5,
    discount: 12,
    terminal: 0,
    value: cashFlowValue(100, 10, -5, 12, 0, 1),
  };
  const valuationInputs = () => ({
    eligible: true,
    latest: { fcf: 100, currency: "USD" },
    share: { value: 10 },
    scenarios: [bear],
  });
  const empty = () => null;
  const component = new Function(
    "React",
    "useState",
    "valuationInputs",
    "cashFlowValue",
    "amount",
    "dateLabel",
    "percent",
    "Help",
    "Notice",
    "SpecializedScenario",
    "reverseGrowth",
    "TriangleAlert",
    "valuationScale",
    code + "; return Valuation;",
  )(
    require("react"),
    useState,
    valuationInputs,
    cashFlowValue,
    String,
    String,
    String,
    empty,
    empty,
    empty,
    empty,
    empty,
    valuationScale,
  );
  const tree = component({
    research: { quote: { price: 80, currency: "USD" } },
  });
  const button = walk(
    tree,
    (n) => n.type === "button" && n.props.className?.startsWith("scenario"),
  );
  assert.ok(button, "Bear scenario is actionable");
  button.props.onClick();
  // growth, selected scenario name, discount, terminal, dilution
  assert.equal(updates[1], "Bear");
  assert.equal(
    cashFlowValue(100, 10, updates[0], updates[2], updates[3], updates[4]),
    bear.value,
  );
});
test("a quote above all examples appears outside their band on the same numeric axis", () => {
  const empty = () => null;
  const component = new Function(
    "React",
    "useState",
    "valuationInputs",
    "cashFlowValue",
    "amount",
    "dateLabel",
    "percent",
    "Help",
    "Notice",
    "SpecializedScenario",
    "reverseGrowth",
    "TriangleAlert",
    "valuationScale",
    code + "; return Valuation;",
  )(
    require("react"),
    (v) => [v, empty],
    () => ({
      eligible: true,
      latest: { fcf: 100, currency: "USD" },
      share: { value: 10 },
      scenarios: [
        { name: "Bear", growth: -5, discount: 12, terminal: 0, value: 60 },
        { name: "Bull", growth: 5, discount: 9, terminal: 2, value: 120 },
      ],
    }),
    cashFlowValue,
    String,
    String,
    String,
    empty,
    empty,
    empty,
    empty,
    empty,
    valuationScale,
  );
  const tree = component({
    research: { quote: { price: 300, currency: "USD" } },
  });
  const labels = walk(tree, (n) => n.props.className === "valuation-labels");
  assert.ok(Number(labels.props.children.at(-1).props.children) > 300);
  const pin = walk(tree, (n) => n.props.className === "value-pin");
  const band = walk(tree, (n) => n.props.className === "valuation-band");
  assert.ok(band);
  assert.ok(
    Number.parseFloat(pin.props.style.left) >
      Number.parseFloat(band.props.style.left) +
        Number.parseFloat(band.props.style.width),
  );
});
