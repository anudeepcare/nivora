import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
const n = sourceModule("lib/settings-navigation.ts");
test("support return preserves research query and hash and rejects external destinations", () => {
  assert.equal(typeof n.documentReturnHref, "function");
  assert.equal(
    n.documentReturnHref("/research/APP?tab=value#cases"),
    "/research/APP?tab=value#cases",
  );
  for (const bad of [
    "//evil.test",
    "/\\evil.test",
    "https://evil.test",
    "/api/admin",
    "/help?from=/help",
  ])
    assert.equal(n.documentReturnHref(bad), "/overview");
  assert.equal(
    n.documentReturnHref("/settings?from=%2Fportfolio"),
    "/settings?from=%2Fportfolio",
  );
});
test("document hopping retains the original return destination", () => {
  assert.equal(typeof n.documentHref, "function");
  assert.equal(
    n.documentHref("privacy", "/help?from=%2Fresearch%2FAPP%3Ftab%3Dvalue"),
    "/privacy?from=%2Fresearch%2FAPP%3Ftab%3Dvalue",
  );
});
