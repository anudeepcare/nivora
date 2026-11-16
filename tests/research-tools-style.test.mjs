import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) => fs.readFileSync("components/" + p, "utf8");
test("all active research tool wrappers carry the scoped owner", () => {
  for (const [file, classes] of [
    [
      "ProfessionalWorkbench.tsx",
      ["position-workbench", "context-workbench", "history-workbench"],
    ],
    ["ExpectationMap.tsx", ["expectation-workbench", "workbench-empty"]],
  ]) {
    const s = read(file);
    assert.match(s, /ResearchTools.module.css/);
    for (const c of classes) assert.ok(s.includes(c + " ${toolStyle.root}"), c);
  }
});
test("tool result values and assumption controls have explicit layout ownership", () => {
  const css = read("ResearchTools.module.css");
  postcss.parse(css);
  for (const name of [
    "expectation-assumptions",
    "expectation-confirm",
    "expectation-result",
    "historical-outcome-cards",
    "position-risk-pair",
    "position-risk-rail",
  ])
    assert.ok(css.includes(name));
  assert.match(css, /font-size: 16px/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
test("Congress list already uses explicit module layout and expectation tables are keyboard accessible", () => {
  const s = read("CongressDisclosures.tsx");
  assert.match(s, /congress-list \$\{styles.list\}/);
  assert.match(
    read("CongressDisclosures.module.css"),
    /\.list\s*\{\s*display: grid/,
  );
  const e = read("ExpectationMap.tsx");
  assert.equal(
    (e.match(/aria-label="Operating expectations sensitivity"/g) || []).length,
    2,
  );
  assert.equal((e.match(/tabIndex=\{0\}/g) || []).length, 2);
});
