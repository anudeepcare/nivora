import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(
  new URL("../scripts/verify-edge-browser.mjs", import.meta.url),
  "utf8",
);
test("browser audit boots local fixture dev, traverses every primary lens, and rejects out-of-fold login", () => {
  assert.match(src, /"dev",\s*"--hostname",\s*"127\.0\.0\.1"/);
  assert.match(src, /reference-navigation\.ts/);
  assert.match(src, /researchLenses/);
  assert.match(
    src,
    /getByRole\("navigation",\s*\{\s*name: "Research sections",?\s*\}\)/,
  );
  assert.match(src, /aria-current/);
  assert.match(src, /Sign-in submit is below the fold/);
  assert.match(src, /\/preview\/compare/);
  assert.match(src, /\/preview\/owner/);
  assert.match(src, /\/track-record/);
  assert.match(src, /\/portfolio-check/);
});
