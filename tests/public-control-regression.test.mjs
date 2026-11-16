import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const landing = postcss.parse(fs.readFileSync("components/PublicLanding.module.css", "utf8"));
const consent = postcss.parse(fs.readFileSync("components/AnalyticsConsent.module.css", "utf8"));
function value(root, selector, property) {
  let result;
  root.walkRules(rule => {
    if (rule.parent.type !== "root" || !rule.selectors.includes(selector)) return;
    rule.walkDecls(property, declaration => result = declaration.value);
  });
  return result;
}
test("public actions remain intentionally styled and touch-sized", () => {
  assert.equal(value(landing, ".page .primary", "display"), "inline-flex");
  assert.equal(value(landing, ".page .primary", "min-height"), "50px");
  assert.equal(value(landing, ".textAction", "min-height"), "44px");
  assert.equal(value(landing, ".page a", "text-decoration"), "none");
});
test("footer privacy choice owns its styles instead of relying on removed globals", () => {
  assert.match(fs.readFileSync("components/AnalyticsConsent.tsx", "utf8"), /s\.footerChoice/);
  assert.equal(value(consent, ".footerChoice", "border"), "0");
  assert.equal(value(consent, ".footerChoice", "background"), "transparent");
  assert.equal(value(consent, ".footerChoice", "min-height"), "44px");
});
test("public footer navigation has explicit link presentation", () => {
  assert.equal(value(landing, ".page a", "text-decoration"), "none");
  assert.equal(value(landing, ".page a", "text-decoration"), "none");
});
