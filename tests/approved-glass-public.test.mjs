import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (f) => fs.readFileSync(f, "utf8");
function final(css, selector, property) {
  let value;
  postcss.parse(css).walkRules((r) => {
    if (
      r.parent.type === "atrule" &&
      r.parent.params?.includes("prefers-reduced-transparency")
    )
      return;
    if (r.selectors.includes(selector))
      r.walkDecls(property, (d) => (value = d.value));
  });
  return value;
}
test("public design inherits the approved theme rather than isolating warm paper colors", () => {
  const css = read("components/PublicLanding.module.css");
  assert.equal(final(css, ".page", "color"), "var(--ink)");
  assert.equal(final(css, ".page", "--ink"), undefined);
  assert.match(css, /radial-gradient/);
  assert.match(
    read("components/PublicLanding.tsx"),
    /Less noise\.[\s\S]*More perspective\./,
  );
});
test("workspace destination grid remains two-up on mobile and retains four real destinations", () => {
  const css = read("components/HomeWorkspace.module.css");
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  const source = read("components/HomeWorkspace.tsx");
  for (const route of ["discover", "watchlist", "research", "#home-workbench"])
    assert.ok(source.includes(route));
  assert.equal(final(css, ".quickLinks a", "background"), "var(--card)");
});
test("auth form owns its glass and respects reduced transparency without losing controls", () => {
  const css = read("components/Session.module.css");
  assert.equal(
    final(css, ".auth .main :global(.mp-auth-panel)", "border-radius"),
    "16px",
  );
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.ok(read("components/Session.tsx").includes("#f5f6fa"));
});
