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
test("scenario canvas pairs explanation and cases, then stacks cases first on mobile", () => {
  const file = "components/ResearchOverview.module.css";
  assert.equal(declarations(file, ".scenarioStage")["align-items"], "start");
  assert.equal(declarations(file, ".scenarioStage")["grid-template-columns"], "minmax(0, 1fr) minmax(0, 1.35fr)");
  const mobile = read(file).split("@media (max-width: 700px)")[1];
  assert.match(mobile, /\.scenarioStage \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(mobile, /\.pillars \{[^}]*grid-row: 1/);
  assert.match(mobile, /\.decisionExplanation \{[^}]*grid-row: 2/);
});
test("research navigation uses touch-sized selected pills with clear hover and keyboard focus", () => {
  const file = "components/ResearchNavigation.module.css";
  assert.equal(declarations(file, ".sections")["overflow-x"], "auto");
  assert.equal(declarations(file, ".sections button")["border-radius"], "14px");
  assert.ok(parseFloat(declarations(file, ".sections button")["min-height"]) >= 44);
  const active = declarations(file, '.sections button[aria-current="page"]');
  assert.equal(
    declarations(file, ".sections button").background,
    "transparent",
  );
  assert.equal(active.background, "var(--blue-soft)");
  assert.equal(active.color, "var(--blue)");
  assert.equal(
    declarations(file, ".sections button:hover").color,
    "var(--ink)",
  );
  assert.equal(
    declarations(file, ".sections button:focus-visible").outline,
    "2px solid var(--blue)",
  );
});
test("dominant brand surfaces no longer restore the rejected lime and forest palette", () => {
  for (const file of [
    "app/core/tokens.css",
    "app/core/preferences.css",
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
  assert.ok(!stage.background || stage.background === "transparent");
  assert.ok(!stage.padding || stage.padding === "0");
  assert.ok(!stage["box-shadow"] || stage["box-shadow"] === "none");
  assert.equal(
    declarations(file, ".chart").background,
    "var(--workspace-panel)",
  );
  assert.match(
    stage["grid-template-columns"],
    /minmax\(0, 1.75fr\) minmax\(310px, 1fr\)/,
  );
});
