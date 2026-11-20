import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) =>
  fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("public lower page uses a reading layout and direct use-case links, retaining all destinations", () => {
  const s = read("components/PublicLanding.tsx");
  assert.match(s, /public-reading-layout/);
  assert.match(s, /className="public-route-map"/);
  assert.match(s, /<Link href=\{href\}>/);
  for (const route of [
    "/compare",
    "/pace",
    "/pricing",
    "/research/APP?tab=Options",
  ])
    assert.ok(s.includes(route));
  assert.match(s, /role="tablist"/);
  assert.match(s, /ArrowLeft/);
});
test("login close is a home link and decorative lock has intrinsic bounds", () => {
  const s = read("components/Session.tsx");
  assert.match(s, /aria-label="Close sign in and return to Auryn"/);
  assert.match(s, /className="mp-icon"\s+width="18"\s+height="18"/);
  assert.match(
    s,
    /href="\/"[^>]*>\s*<span aria-hidden="true">×<\/span> Close/s,
  );
});
test("scoped lower layout and auth sizing cover narrow screens without global overrides", () => {
  const s = read("components/PublicLandingRefresh.css");
  assert.match(s, /@media\s*\(max-width:\s*760px\)/);
  assert.match(s, /public-reading-layout/);
  const a = read("components/SessionAccess.css");
  assert.match(a, /\.mp-auth-disclaimer\s*>\s*svg/);
  assert.match(a, /flex:\s*0 0 18px/);
});
