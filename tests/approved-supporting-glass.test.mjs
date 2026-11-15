import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = (name) => readFileSync(`components/${name}.module.css`, "utf8");
test("supporting tools share approved glass surfaces instead of dark/gold heroes", () => {
  for (const name of ["ContributionCompare", "OwnerHandbook", "OptionsTape"]) {
    assert.match(css(name), /var\(--workspace-panel\)/);
    assert.doesNotMatch(css(name), /#edc17c|#172c2a|#24292a|#def66b/i);
  }
});
test("options selection follows interaction tokens, not financial green or citron", () => {
  for (const name of ["OptionsDesk", "OptionsSimulation"]) {
    assert.match(css(name), /background: var\(--accent-solid\)/);
    assert.doesNotMatch(css(name), /var\(--citron\)/);
  }
});
test("contribution has one compact header definition and reduced transparency fallback", () => {
  assert.equal(
    (css("ContributionCompare").match(/\.root header \{/g) || []).length,
    3,
  );
  assert.match(css("ContributionCompare"), /prefers-reduced-transparency/);
  assert.match(css("ContributionCompare"), /min-height: 44px/);
});
