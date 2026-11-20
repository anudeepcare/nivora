import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) =>
  fs.readFileSync(new URL("../components/" + name, import.meta.url), "utf8");

test("contour headline foreground is explicit and outranks public theme defaults", () => {
  const css = read("PublicLandingRefresh.css");
  assert.match(
    css,
    /#auryn-app \.public-reading-layout h1#ap-hero-heading\s*\{[^}]*color:\s*#f[0-9a-f]{5}/i,
  );
});

test("product walkthrough puts the reading and explanatory graphic beside each other when space permits", () => {
  const css = read("PublicLandingRefresh.css");
  assert.match(
    css,
    /\.public-tour-panel:not\(\[hidden\]\)\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(/,
  );
  assert.doesNotMatch(css, /column-reverse/);
  assert.match(css, /\.public-tour-tabs button\s*\{[^}]*flex:\s*0 0 auto/);
});

test("public method and utility paths do not depend on opening repetitive question cards", () => {
  const page = read("PublicLanding.tsx");
  assert.match(page, /<ol className="public-pace-path"/);
  assert.match(page, /data-stage=\{level\}/);
  assert.doesNotMatch(
    page,
    /className="public-question"|public-continuity|A clearer view starts here/,
  );
  for (const path of [
    "/compare",
    "/pace",
    "/pricing",
    "/research/APP?tab=Options",
    "/portfolio-check",
    "/track-record",
    "/login?mode=signup",
  ])
    assert.ok(page.includes(path));
  assert.match(page, /page="help"/);
  assert.match(page, /<PrivacyChoices compact/);
});
