import test from "node:test";
import assert from "node:assert/strict";
import { secObservations } from "../lib/sec-observations.ts";
import { workspaceSymbolBatches } from "../lib/workspace.ts";
import { scheduledCandidates } from "../lib/paper-policy.ts";
test("SEC alternates retain new periods and do not double-count the same filing", () => {
  const row = {
      val: 1,
      start: "2025-01-01",
      end: "2025-12-31",
      filed: "2026-02-01",
      accn: "new",
      form: "10-K",
    },
    old = { ...row, end: "2024-12-31", accn: "old" };
  const r = secObservations(
    {
      Preferred: { units: { USD: [old] } },
      Fallback: { units: { USD: [old, row] } },
    },
    ["Preferred", "Fallback"],
  );
  assert.equal(r.length, 2);
  assert.equal(r.find((x) => x.row.accn === "old").tag, "Preferred");
  assert.equal(r.find((x) => x.row.accn === "new").tag, "Fallback");
});
test("all 200 holdings receive a quote batch ahead of watchlist names", () => {
  const p = Array.from({ length: 200 }, (_, i) => ({
      symbol: `Z${i}`,
      assetType: "stock",
    })),
    w = Array.from({ length: 50 }, (_, i) => ({ symbol: `A${i}` }));
  const groups = workspaceSymbolBatches(p, w);
  assert.equal(groups.flat().length, 250);
  assert.equal(
    groups
      .flat()
      .slice(0, 200)
      .every((s) => s.startsWith("Z")),
    true,
  );
  assert.ok(groups.every((g) => g.length <= 20));
});
test("a definite pre-submission failure does not starve the next scheduled plan", async () => {
  const seen = [];
  const r = await scheduledCandidates(["bad", "good", "later"], async (id) => {
    seen.push(id);
    if (id === "bad") throw Error("Price outside limit");
    return { status: "accepted" };
  });
  assert.deepEqual(seen, ["bad", "good"]);
  assert.equal(r.length, 2);
});
