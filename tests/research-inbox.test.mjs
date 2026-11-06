import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
function api() {
  let r;
  try {
    r = sourceModule("lib/research-inbox.ts");
  } catch {}
  assert.ok(r, "inbox engine exists");
  return r;
}
test("inbox deduplicates dated events and never invents an earnings beat", () => {
  const { researchInbox } = api();
  const e = {
    symbol: "APP",
    date: "2026-11-05",
    kind: "earnings",
    detail: "Earnings",
    actual: null,
    estimate: 1,
  };
  const items = researchInbox({
    today: "2026-11-04",
    events: [e, e],
    positions: [],
  });
  assert.equal(items.length, 1);
  assert.match(items[0].title, /Upcoming/);
  assert.doesNotMatch(items[0].title, /beat/i);
});
test("inbox flags missing basis, not a valid zero cost, and excludes distant events", () => {
  const { researchInbox } = api();
  const items = researchInbox({
    today: "2026-11-04",
    events: [
      { symbol: "APP", date: "2027-01-01", kind: "earnings", detail: "" },
    ],
    positions: [
      { symbol: "HIMS", assetType: "stock", cost: NaN, quantity: 3 },
      { symbol: "MSFT", assetType: "stock", cost: 0, quantity: 3 },
    ],
  });
  assert.equal(items.length, 1);
  assert.match(items[0].title, /HIMS/);
});
test("snooze expires and dispositions never hide new events for the same company", () => {
  const { visibleInbox } = api();
  const rows = [
    { id: "APP:earnings:2026-11-05" },
    { id: "APP:earnings:2027-02-04" },
  ];
  assert.equal(
    visibleInbox(
      rows,
      { "APP:earnings:2026-11-05": { until: "2026-11-06" } },
      "2026-11-04",
    ).length,
    1,
  );
  assert.equal(
    visibleInbox(
      rows,
      { "APP:earnings:2026-11-05": { until: "2026-11-06" } },
      "2026-11-06",
    ).length,
    2,
  );
});
