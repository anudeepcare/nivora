import test from "node:test";
import assert from "node:assert/strict";
import { activityQuery, projectActivity } from "../lib/politician-activity.ts";
const now = Date.parse("2026-11-18T18:00:00Z"),
  q = activityQuery(new URLSearchParams());
const row = {
  politicianName: "Example Member",
  bioguideId: "E000001",
  urlSlug: "Example-Member",
  chamber: "HOUSE",
  party: "Independent",
  state: "CA",
  ticker: "ABC",
  assetType: "Stock",
  transactionType: "PURCHASE",
  transactionDate: "2026-08-01",
  disclosureDate: "2026-11-17",
  amountRange: "Over $50,000,000",
  amountMin: 50000000,
  amountMax: null,
  owner: "Spouse",
};
test("bounded request accepts only documented window choices and manual offsets", () => {
  assert.deepEqual(q, { days: 90, offset: 0 });
  for (const s of [
    "days=366",
    "offset=1001",
    "offset=5",
    "days=30&days=90",
    "url=x",
  ])
    assert.throws(() => activityQuery(new URLSearchParams(s)));
});
test("disclosure-window permits older transactions and keeps range, owner, identity", () => {
  const d = projectActivity(
    { isPreview: false, totalCount: 1, data: [row] },
    q,
    now,
  );
  assert.equal(d.rows[0].transactionDate, "2026-08-01");
  assert.equal(d.rows[0].disclosureDate, "2026-11-17");
  assert.equal(d.rows[0].amountMax, null);
  assert.equal(d.rows[0].owner, "Spouse");
  assert.equal(d.rows[0].bioguideId, "E000001");
  assert.equal(d.rows[0].dateBasis, "Disclosure date");
});
test("missing filing dates use explicitly labeled transaction fallback; missing dates and future rows are omitted", () => {
  const d = projectActivity(
    {
      isPreview: false,
      totalCount: 3,
      data: [
        { ...row, disclosureDate: null, transactionDate: "2026-11-17" },
        { ...row, transactionDate: null, disclosureDate: null },
        { ...row, disclosureDate: "2099-01-01" },
      ],
    },
    q,
    now,
  );
  assert.equal(d.rows.length, 1);
  assert.equal(d.rows[0].disclosureDate, null);
  assert.equal(d.rows[0].dateBasis, "Transaction date fallback");
  assert.equal(d.omitted, 2);
});
test("preview cannot masquerade as later page and invalid values never imply zero", () => {
  assert.throws(() =>
    projectActivity({ isPreview: true, data: Array(6).fill(row) }, q, now),
  );
  assert.throws(() =>
    projectActivity(
      { isPreview: true, data: [row] },
      { ...q, offset: 50 },
      now,
    ),
  );
  assert.throws(() =>
    projectActivity({ isPreview: false, totalCount: 0, data: [row] }, q, now),
  );
  const d = projectActivity(
    {
      isPreview: false,
      totalCount: 1,
      data: [{ ...row, amountMin: 10, amountMax: 1 }],
    },
    q,
    now,
  );
  assert.equal(d.rows.length, 0);
});
test("option detail retained only as filed metadata, not a directional signal", () => {
  const d = projectActivity(
    {
      isPreview: false,
      totalCount: 1,
      data: [
        {
          ...row,
          assetType: "Stock Option",
          assetMetadata: {
            kind: "OPTION",
            optionType: "PUT",
            strikePrice: 10,
            expirationDate: "2027-01-15",
          },
          sentiSenseScore: 99,
        },
      ],
    },
    q,
    now,
  );
  assert.equal(d.rows[0].option.optionType, "PUT");
  assert.equal(JSON.stringify(d).includes("sentiSenseScore"), false);
});
