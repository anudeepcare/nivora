import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { groupMarketEvents } from "../lib/home-feed.ts";
const source = fs.readFileSync("components/HomeWorkspace.tsx", "utf8");
function run(positions, calendarEvents) {
  const ast = ts.createSourceFile(
    "Home.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const home = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "HomeOverview",
  );
  const names = ["heldSymbols", "eventGroups"];
  const declarations = home.body.statements
    .filter(ts.isVariableStatement)
    .flatMap((n) => n.declarationList.declarations)
    .filter((n) => names.includes(n.name.getText(ast)));
  assert.equal(declarations.length, 2);
  const text = declarations
    .map((n) => "const " + n.getText(ast) + ";")
    .join("\n");
  return new Function(
    "workspace",
    "calendarEvents",
    "groupMarketEvents",
    ts.transpileModule(text + "\nreturn {heldSymbols,eventGroups};", {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
  )({ positions }, calendarEvents, groupMarketEvents);
}
test("existing calendar remains date ordered, with real held positions first within each day", () => {
  const events = [
    { symbol: "WATCH", date: "2026-11-20", kind: "Earnings" },
    { symbol: "HELD", date: "2026-11-20", kind: "Earnings" },
    { symbol: "WATCH", date: "2026-11-19", kind: "Earnings" },
  ];
  const r = run([{ symbol: "HELD", quantity: 5, assetType: "stock" }], events);
  assert.deepEqual(
    r.eventGroups.map((g) => g.date),
    ["2026-11-19", "2026-11-20"],
  );
  assert.deepEqual(
    r.eventGroups[1].events.map((e) => e.symbol),
    ["HELD", "WATCH"],
  );
  assert.equal(events[0].symbol, "WATCH");
});
test("cash, zero and invalid positions are not held; shorts count and empty calendar stays empty", () => {
  const r = run(
    [
      { symbol: "CASH", quantity: 100, assetType: "cash" },
      { symbol: "ZERO", quantity: 0, assetType: "stock" },
      { symbol: "BAD", quantity: NaN, assetType: "stock" },
      { symbol: "SHORT", quantity: -2, assetType: "stock" },
    ],
    [],
  );
  assert.deepEqual([...r.heldSymbols], ["SHORT"]);
  assert.deepEqual(r.eventGroups, []);
  assert.match(
    source,
    /heldSymbols.has\(event.symbol\)\s*\? " · Held"\s*:\s*""/,
  );
});
