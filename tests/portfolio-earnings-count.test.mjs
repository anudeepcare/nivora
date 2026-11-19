import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function count(positions, earnings) {
  const s = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  const ast = ts.createSourceFile(
    "page.tsx",
    s,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let expr;
  function walk(n) {
    if (
      ts.isVariableDeclaration(n) &&
      n.name.getText(ast) === "earningsHoldingsCount"
    )
      expr = n.initializer.getText(ast);
    ts.forEachChild(n, walk);
  }
  walk(ast);
  assert.ok(expr, "explicit unique holdings count");
  const js = ts.transpileModule(`const value=${expr};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("positions", "earnings", js + "return value;")(
    positions,
    new Set(earnings),
  );
}
const stock = (symbol, quantity) => ({ symbol, quantity, assetType: "stock" });
test("multiple nonzero lots for a supplied ticker count once", () => {
  assert.equal(
    count([stock("APP", 2), stock("APP", 3), stock("NOW", 1)], ["APP", "NOW"]),
    2,
  );
});
test("zero quantity, unrelated tickers and non-stock rows do not inflate supplied date count", () => {
  assert.equal(
    count(
      [
        stock("APP", 0),
        stock("NOW", 4),
        stock("META", 2),
        { symbol: "BTC", quantity: 1, assetType: "crypto" },
      ],
      ["APP", "META", "BTC", "ZETA"],
    ),
    1,
  );
  assert.equal(count([stock("APP", 0)], ["APP"]), 0);
});
test("incomplete calendar cue is retained", () => {
  assert.match(
    fs.readFileSync("components/PortfolioPage.tsx", "utf8"),
    /Calendar coverage may be incomplete/,
  );
});
