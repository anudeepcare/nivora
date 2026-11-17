import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
const { cleanDocument } = sourceModule("lib/documents.ts");
test("watchlist checkpoints retain their review date and business condition", () => {
  const d = cleanDocument("note", {
    thesis: "Growth",
    condition: "Margin falls",
    reviewDate: "2026-11-10",
  });
  assert.equal(d.reviewDate, "2026-11-10");
  assert.equal(d.condition, "Margin falls");
});
test("checkpoint rejects impossible calendar dates", () => {
  assert.throws(
    () => cleanDocument("note", { reviewDate: "2026-02-31" }),
    /date/i,
  );
});
