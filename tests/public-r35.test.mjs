import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import postcss from "postcss";
const require = createRequire(import.meta.url);
const load = (name) =>
  fs.readFileSync(new URL("../components/" + name, import.meta.url), "utf8");
function declarations(css, predicate) {
  const result = [];
  postcss.parse(css).walkRules((r) => {
    if (predicate(r.selector))
      r.walkDecls((d) => result.push([d.prop, d.value]));
  });
  return result;
}
test("literal heading ID survives CSS compilation and matches the color rule in both themes", async () => {
  const opening = load("PublicPlaidOpening.tsx");
  const publicStyle = "PublicLandingRefresh.css";
  const css = (
    await postcss([]).process(load(publicStyle), { from: publicStyle })
  ).css;
  assert.match(opening, /<h1 id="ap-hero-heading">/);
  assert.deepEqual(
    declarations(
      css,
      (s) => s === "#auryn-app .public-reading-layout h1#ap-hero-heading",
    ).filter(([property]) => property === "color"),
    [["color", "#f3f8ff"]],
  );
  assert.doesNotMatch(
    load("PublicPlaidOpening.module.css"),
    /#ap-hero-heading/,
  );
});
test("product and lower content share one gutter and support stays a short visible link", () => {
  const opening = load("PublicPlaidOpening.tsx");
  const landing = load("PublicLanding.tsx");
  assert.match(opening, /className=\{[^\n]+public-product-width/);
  const rule = declarations(
    load("PublicLandingRefresh.css"),
    (s) => s.includes(".public-product-width") && s.includes(".public-footer"),
  );
  assert.ok(
    rule.some(([p, v]) => p === "width" && v === "var(--public-lower)"),
  );
  assert.ok(rule.some(([p, v]) => p === "padding-inline" && v === "0"));
  assert.match(
    landing,
    /href=\{\x60mailto:\$\{SUPPORT_EMAIL\}\x60\}\s+aria-label=\{\x60Email support at \$\{SUPPORT_EMAIL\}\x60\}/,
  );
  assert.doesNotMatch(landing, />\{SUPPORT_EMAIL\}<\/a>/);
});
test("public menu uses normal-flow positioning so it scrolls away", () => {
  const opening = load("PublicPlaidOpening.tsx");
  assert.match(opening, /<header\b[^>]*data-public-menu/);
  assert.ok(
    declarations(load("PublicLandingRefresh.css"), (s) =>
      s.includes("[data-public-menu]"),
    ).some(([p, v]) => p === "position" && v === "relative"),
  );
});
