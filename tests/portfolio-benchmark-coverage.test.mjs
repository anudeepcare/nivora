import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function matched(points, benchmark) {
  const source = fs.readFileSync("components/AccountHistory.tsx", "utf8");
  const ast = ts.createSourceFile(
    "view.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let expression;
  function walk(n) {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === "matchedDates")
      expression = n.initializer.getText(ast);
    ts.forEachChild(n, walk);
  }
  walk(ast);
  assert.ok(expression, "actual benchmark card computes overlap");
  const js = ts.transpileModule(`const matchedDates = ${expression};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("points", "benchmark", js + "return matchedDates;")(
    points,
    benchmark,
  );
}
const rows = (dates) => dates.map((date) => ({ date, equity: 100 }));
test("existing comparison card counts only exact shared displayed valuation dates", () => {
  assert.deepEqual(
    matched(rows(["2026-05-01", "2026-06-01", "2026-07-01"]), {
      status: "available",
      points: [
        { date: "2026-04-01", value: 90 },
        { date: "2026-05-01", value: 100 },
        { date: "2026-07-01", value: 120 },
      ],
    }),
    ["2026-05-01", "2026-07-01"],
  );
});
test("missing benchmark and nonfinite values do not become comparable coverage", () => {
  assert.deepEqual(matched(rows(["2026-05-01"]), undefined), []);
  assert.deepEqual(
    matched(rows(["2026-05-01"]), {
      status: "unavailable",
      points: [{ date: "2026-05-01", value: 100 }],
    }),
    [],
  );
  assert.deepEqual(
    matched(rows(["2026-05-01"]), {
      status: "available",
      points: [{ date: "2026-05-01", value: NaN }],
    }),
    [],
  );
});
test("card states exact date coverage and missing latest observation without claiming relative return", () => {
  const source = fs.readFileSync("components/AccountHistory.tsx", "utf8");
  assert.match(source, /Matched valuation dates:/);
  assert.match(source, /No benchmark balance on the latest account date/);
  assert.match(
    source,
    /changing the window does not calculate a period return/,
  );
});
