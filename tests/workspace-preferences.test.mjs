import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
const { cleanDocument } = sourceModule("lib/documents.ts");
test("saved workspace preferences retain only validated presentation choices", () => {
  const p = cleanDocument("view", {
    preferences: {
      style: "Growth",
      detail: "advanced",
      horizon: "long",
      watchSort: "name",
      chartRange: "3M",
      concentrationLimit: 25,
      admin: true,
    },
  });
  assert.equal(p.preferences?.style, "Growth");
  assert.equal(p.preferences?.admin, undefined);
  assert.equal(p.preferences?.concentrationLimit, 25);
});
test("invalid concentration threshold never becomes an active alert", () => {
  const p = cleanDocument("view", { preferences: { concentrationLimit: -1 } });
  assert.equal(p.preferences?.concentrationLimit, null);
});
