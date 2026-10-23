import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const source = fs.readFileSync(
  new URL("../components/Accumulation.tsx", import.meta.url),
  "utf8",
);
const ast = ts.createSourceFile(
  "Accumulation.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Accumulation",
);
const code = ts.transpileModule(
  declaration.getText(ast).replace("export default ", ""),
  {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  },
).outputText;
function findChart(node) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "chart") return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const found = findChart(child);
    if (found) return found;
  }
  return null;
}
test("DCA chart labeled twelve months excludes older trading sessions", () => {
  const history = [];
  for (let i = 0; i < 550; i++) {
    const date = new Date(Date.UTC(2026, 9, 16) - i * 86400000);
    if (![0, 6].includes(date.getUTCDay()))
      history.unshift({
        time: date.toISOString().slice(0, 10),
        close: 100,
        open: 99,
        high: 101,
        low: 98,
        volume: 10,
      });
  }
  const component = new Function(
    "React",
    "researchAccumulation",
    "amount",
    "percent",
    "Help",
    "Notice",
    "PriceChart",
    code + "; return Accumulation;",
  )(
    require("react"),
    () => ({ history: [], version: "test", reason: "Insufficient history" }),
    String,
    String,
    "help",
    "notice",
    "chart",
  );
  const tree = component({
    research: {
      company: { assetType: "stock" },
      history,
      retrievedAt: "2026-10-17T00:00:00Z",
      quote: { currency: "USD" },
    },
  });
  const bars = findChart(tree).props.bars;
  assert.ok(bars.length > 200 && bars.length < 270);
  assert.ok(Date.parse(bars[0].time) >= Date.parse("2025-10-16"));
  assert.equal(bars.at(-1).time, "2026-10-16");
});
