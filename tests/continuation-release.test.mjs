import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
test("candidate releases cannot trigger a published release announcement", () => {
  let r;
  try {
    r = sourceModule("lib/releases.ts");
  } catch {}
  assert.ok(r, "release registry exists");
  assert.equal(
    r.latestPublished([
      { version: "x", status: "candidate", date: "2026-11-04" },
    ]),
    null,
  );
  assert.equal(
    r.latestPublished([
      { version: "x", status: "published", date: "2026-11-04" },
    ]).version,
    "x",
  );
});
