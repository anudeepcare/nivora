import test from "node:test";
import assert from "node:assert/strict";
import {
  quarterlyQuery,
  selectQuarter,
  projectQuarterly,
} from "../lib/institution-quarterly.ts";
const now = Date.parse("2026-11-18T12:00:00Z");
const q = quarterlyQuery(new URLSearchParams("view=bonds"));
const quarters = [
  { reportDate: "2026-09-30", pending: true },
  { reportDate: "2026-06-30", pending: false },
];
test("only returned nonpending past quarter dates can be selected", () => {
  assert.equal(selectQuarter(quarters, "", now), "2026-06-30");
  assert.throws(() => selectQuarter(quarters, "2026-09-30", now));
  assert.throws(() => selectQuarter(quarters, "2025-12-31", now));
  assert.throws(() =>
    selectQuarter([{ reportDate: "2099-12-31", pending: false }], "", now),
  );
  assert.throws(() => quarterlyQuery(new URLSearchParams("view=bonds&url=x")));
  assert.throws(() =>
    quarterlyQuery(new URLSearchParams("view=bonds&view=options")),
  );
});
test("closed bond projection retains units and nulls not fabricated zeros", () => {
  const d = projectQuarterly(
    {
      isPreview: false,
      data: [
        {
          baseTicker: "ABNB",
          companyName: "Airbnb",
          positionCount: 24,
          totalValue: 850000000,
          netSharesChange: -2,
          bondTickers: "ABNB 0 03/15/26",
          hedgeFundCount: 18,
          secret: "no",
        },
      ],
    },
    q,
    "2026-06-30",
    now,
  );
  assert.equal(d.rows[0].ticker, "ABNB");
  assert.equal(d.rows[0].metrics[2].value, -2);
  assert.equal(JSON.stringify(d).includes("secret"), false);
  const missing = projectQuarterly(
    { isPreview: false, data: [{ baseTicker: "ABNB", totalValue: -1 }] },
    q,
    "2026-06-30",
    now,
  );
  assert.equal(missing.rows[0].metrics[1].value, null);
});
test("preview and response bounds fail closed, identities deduplicate", () => {
  assert.throws(() =>
    projectQuarterly(
      { isPreview: true, data: Array(4).fill({ baseTicker: "A" }) },
      q,
      "2026-06-30",
      now,
    ),
  );
  assert.throws(() =>
    projectQuarterly(
      { isPreview: false, data: Array(5001).fill({ baseTicker: "A" }) },
      q,
      "2026-06-30",
      now,
    ),
  );
  const d = projectQuarterly(
    {
      isPreview: false,
      data: [
        { baseTicker: "A" },
        { baseTicker: "A" },
        { baseTicker: "bad/url" },
      ],
    },
    q,
    "2026-06-30",
    now,
  );
  assert.equal(d.rows.length, 1);
  assert.equal(d.omitted, 2);
});
test("options retain reported share changes and do not infer direction or contracts", () => {
  const d = projectQuarterly(
    {
      isPreview: false,
      data: [
        {
          ticker: "TSLA",
          callValue: 0,
          putValue: 10,
          callPositions: 0,
          putPositions: 1,
          callNetChange: -30,
          putNetChange: 20,
          hedgeFundCount: 1,
        },
      ],
    },
    quarterlyQuery(new URLSearchParams("view=options")),
    "2026-06-30",
    now,
  );
  assert.equal(d.rows[0].metrics[0].value, 0);
  assert.equal(d.rows[0].metrics[4].value, -30);
  assert.equal(d.view, "options");
  assert.throws(() =>
    projectQuarterly(
      {
        isPreview: false,
        data: [{ ticker: "TSLA", reportDate: "2026-03-31" }],
      },
      quarterlyQuery(new URLSearchParams("view=options")),
      "2026-06-30",
      now,
    ),
  );
});
