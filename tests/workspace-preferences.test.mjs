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
test("signal visibility persists only supported presentation keys", () => {
  const p = cleanDocument("view", { preferences: { hiddenSignals: ["options", "options", "congressional", "admin", 7] } });
  assert.deepEqual(p.preferences?.hiddenSignals, ["options", "congressional"]);
  const defaults = cleanDocument("view", { preferences: {} });
  assert.deepEqual(defaults.preferences?.hiddenSignals, []);
});
test("guardrail percent settings reject invalid limits without invented defaults",()=>{
 const defaults=cleanDocument("view",{preferences:{}}).preferences;assert.equal(defaults.cashReservePercent,null);assert.equal(defaults.maxLossPercent,null);
 const valid=cleanDocument("view",{preferences:{cashReservePercent:10,maxLossPercent:1}}).preferences;assert.equal(valid.cashReservePercent,10);assert.equal(valid.maxLossPercent,1);
 for(const value of [-1,101,"10",NaN]){const p=cleanDocument("view",{preferences:{cashReservePercent:value,maxLossPercent:value}}).preferences;assert.equal(p.cashReservePercent,null);assert.equal(p.maxLossPercent,null);}
});
