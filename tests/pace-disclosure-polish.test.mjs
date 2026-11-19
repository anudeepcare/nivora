import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../components/AccumulationDesk.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../components/ResearchLens.module.css", import.meta.url),
  "utf8",
);
test("conditional Pace policy ends with a visible word separator", () => {
  assert.match(source, /beyond a threshold\."\}\{" "\}/);
});
test("legacy comparison remains explicit and scoped to a compact two-column layout", () => {
  assert.match(source, /styles\.paceEvaluation/);
  assert.match(source, /It does not implement today’s P1 Watch\/Hold rule/);
  assert.match(source, /not validation of AURYN’s/);
  assert.match(source, /evaluation\.limitations\.map/);
  assert.match(source, /Fees \+ slippage · bps/);
  assert.match(source, /evaluation\.holdout\.months/);
  assert.match(
    css,
    /\.paceEvaluation :global\(\.policy-results\)\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s,
  );
  assert.match(
    css,
    /\.paceEvaluation :global\(\.policy-results\) article\s*\{[^}]*border:\s*0/s,
  );
});
