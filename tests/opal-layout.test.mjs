import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) => fs.readFileSync(p, "utf8");
const declarations = (path, selector) => {
  const values = {};
  postcss.parse(read(path)).walkRules(selector, (rule) => {
    if (rule.parent.type === "root")
      rule.walkDecls((d) => (values[d.prop] = d.value));
  });
  return values;
};
test("approved snapshots use four independent cards without stretched empty columns", () => {
  const file = "components/ResearchOverview.module.css";
  assert.equal(declarations(file, ".caseWorkspace")["align-items"], "start");
  assert.equal(declarations(file, ".caseWorkspace")["grid-template-columns"], "repeat(4, minmax(0, 1fr))");
  assert.match(read(file), /@media \(max-width: 1100px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(read(file), /@media \(max-width: 600px\)[\s\S]*\.caseWorkspace \{\s*grid-template-columns: minmax\(0, 1fr\)/);
});
test("studio research navigation uses an underline rail with clear hover and keyboard focus", () => {
  const file = "components/ResearchNavigation.module.css";
  assert.equal(
    declarations(file, ".sections.sections").background,
    "transparent",
  );
  assert.equal(declarations(file, ".sections.sections")["border-radius"], "0");
  const active = declarations(
    file,
    '.sections.sections button[aria-current="page"]',
  );
  assert.equal(active.background, "transparent");
  assert.equal(active["box-shadow"], "inset 0 -3px 0 var(--blue)");
  assert.equal(
    declarations(
      file,
      '.sections.sections button:not([aria-current="page"]):hover',
    ).color,
    "var(--ink)",
  );
  assert.equal(
    declarations(file, ".sections.sections button:focus-visible").outline,
    "2px solid var(--blue)",
  );
});
test("dominant brand surfaces no longer restore the rejected lime and forest palette", () => {
  for (const file of [
    "app/core/tokens.css",
    "app/appearance.css",
    "components/PublicLanding.module.css",
    "components/PaceInstrument.module.css",
  ]) {
    assert.doesNotMatch(
      read(file),
      /#(?:d6f35a|284c3e|f1f3ee|1b2922)\b/i,
      file,
    );
    assert.doesNotThrow(() => postcss.parse(read(file)));
  }
});

test("studio decision and chart are peer surfaces rather than nested cards", () => {
  const file = "components/ResearchOverview.module.css";
  const stage = declarations(file, ".decisionStage");
  assert.equal(stage.background, "transparent");
  assert.equal(stage.padding, "0");
  assert.equal(stage["box-shadow"], "none");
  assert.equal(
    declarations(file, ".decisionStage .chart").background,
    "var(--workspace-glass)",
  );
  assert.match(stage["grid-template-columns"], /minmax\(0, 1.8fr\) minmax\(320px, 1fr\)/);
});
