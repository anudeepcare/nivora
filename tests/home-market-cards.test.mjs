import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("components/HomeMarketCards.tsx", "utf8");
const ast = ts.createSourceFile(
  "HomeMarketCards.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "usableHistory",
);
const code = ts.transpileModule(declaration.getText(ast), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const valid = new Function("DAY", code + ";return usableHistory;")(86400000);
const now = Date.parse("2026-11-05T16:00:00Z");
const row = (time, close = 100) => ({ time, close });
test("Home price areas use settled dated observations and never create a decorative trend from stale or invalid data", () => {
  assert.deepEqual(
    valid([row("2026-11-03"), row("2026-11-04"), row("2026-11-05")], now).map(
      (p) => p.time,
    ),
    ["2026-11-03", "2026-11-04"],
  );
  for (const points of [
    [row("2026-10-01"), row("2026-10-02")],
    [row("2026-11-04"), row("2026-11-06")],
    [row("bad"), row("2026-11-04")],
    [row("2026-11-03", 0), row("2026-11-04")],
  ])
    assert.deepEqual(valid(points, now), []);
  assert.deepEqual(
    valid([row("2026-11-04"), row("2026-11-05")], now).map((x) => x.time),
    [],
  );
});
