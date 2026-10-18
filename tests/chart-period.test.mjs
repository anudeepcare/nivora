import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  if (!fs.existsSync("lib/chart-period.ts")) return {};
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync("lib/chart-period.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", code)(exports);
  return exports;
}
const bars = [
  { time: "2026-10-05", open: 10, high: 14, low: 9, close: 12, volume: 100 },
  { time: "2026-10-06", open: 12, high: 15, low: 11, close: 13, volume: 200 },
  { time: "2026-10-12", open: 13, high: 17, low: 12, close: 16, volume: 300 },
];
test("weekly chart bars preserve first open, extrema, last close and summed volume", () => {
  const { groupHistory } = load();
  assert.equal(typeof groupHistory, "function");
  assert.deepEqual(groupHistory(bars, "Weekly")[0], {
    time: "2026-10-05",
    open: 10,
    high: 15,
    low: 9,
    close: 13,
    volume: 300,
  });
  assert.equal(groupHistory(bars, "Weekly").length, 2);
});
test("monthly chart controls change the actual bar interval instead of relabeling daily bars", () => {
  const { groupHistory } = load();
  assert.equal(typeof groupHistory, "function");
  const rows = groupHistory(bars, "Monthly");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].time, "2026-10-01");
  assert.equal(rows[0].close, 16);
  assert.equal(rows[0].volume, 600);
});
