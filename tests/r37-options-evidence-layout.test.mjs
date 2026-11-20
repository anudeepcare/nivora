import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  "components/OptionsPositioningOverview.tsx",
  "utf8",
);
const css = readFileSync(
  "components/OptionsPositioningOverview.module.css",
  "utf8",
);
test("large prints are near their scope caveat without turning each metric into a card", () => {
  assert.match(source, /<dl className=\{styles.printMetrics\}/);
  assert.match(source, /<summary>How large prints are measured<\/summary>/);
  assert.match(source, /Latest published prints session; date not supplied/);
});
test("contract activity is a quiet selectable list preserving summary metrics and details", () => {
  assert.match(source, /<ul className=\{styles.contractList\}/);
  assert.match(source, /<li key=\{c.contract\}/);
  assert.match(source, /Open interest \{number\(c.oi\)\}/);
  assert.match(source, /Volume \{number\(c.volume\)\}/);
  assert.doesNotMatch(source, /c.volume \/ maximum\) \* 23/);
  assert.match(css, /\.contractList[^{}]+details\s*\{[^}]*border: 0/s);
  assert.match(css, /\.contractList[^{}]+summary:focus-visible/);
});
