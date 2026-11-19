import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
test("compact analytics action shares final landing footer link typography and target rules", () => {
  const css = postcss.parse(
    fs.readFileSync("components/PublicLanding.module.css", "utf8"),
  );
  const rules = [];
  css.walkRules((r) => {
    if (
      r.selector.includes(".footer nav") &&
      r.selector.includes("footer-analytics-choice") &&
      !r.selector.includes(":focus-visible")
    )
      rules.push(r);
  });
  assert.equal(rules.length, 2, "desktop and mobile paired rules");
  const decl = Object.fromEntries(
    rules[0].nodes
      .filter((n) => n.type === "decl")
      .map((d) => [d.prop, d.value]),
  );
  assert.match(rules[0].selector, /\.footer nav a/);
  assert.equal(decl["font-size"], "12px");
  assert.equal(decl["font-weight"], "400");
  assert.equal(decl["line-height"], "1.45");
  assert.equal(decl.display, "inline-flex");
  assert.equal(decl["align-items"], "center");
  assert.equal(decl["min-height"], "36px");
  assert.equal(
    rules[1].nodes.find((d) => d.prop === "min-height").value,
    "44px",
  );
});
test("analytics remains a semantic button that opens the same privacy event, without consent mutation", () => {
  const s = fs.readFileSync("components/AnalyticsConsent.tsx", "utf8");
  const component = s.slice(
    s.indexOf("export function PrivacyChoices"),
    s.indexOf("export default function"),
  );
  assert.match(component, /type="button"/);
  assert.match(component, /new Event\("auryn:privacy"\)/);
  assert.doesNotMatch(component, /localStorage|gtag\(/);
  const css = fs.readFileSync("components/PublicLanding.module.css", "utf8");
  assert.match(css, /footer-analytics-choice.*focus-visible/);
});
