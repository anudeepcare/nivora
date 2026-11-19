import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const m = { exports: {} };
new Function(
  "exports",
  ts.transpileModule(fs.readFileSync("lib/pace-chart-levels.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(m.exports);
const lum = (h) => {
  const c = h
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
test("Pace chart signals remain distinguishable against light and dark chart surfaces", () => {
  for (const c of Object.values(m.exports.paceChartColours))
    for (const bg of ["#ffffff", "#151b26"])
      assert.ok(
        (Math.max(lum(c), lum(bg)) + 0.05) /
          (Math.min(lum(c), lum(bg)) + 0.05) >=
          3,
        `${c} on ${bg}`,
      );
});
test("extension candle override has explicit non-directional legend", () => {
  const s = fs.readFileSync("components/AccumulationDesk.tsx", "utf8");
  assert.match(s, /Price-extension review/);
  assert.match(s, /not price direction/);
  assert.match(s, /paceExtensionColour/);
});
