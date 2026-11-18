import test from "node:test";
import assert from "node:assert/strict";
import {
  politicianQuery,
  projectDirectory,
  projectMember,
} from "../lib/politician-members.ts";
const now = Date.parse("2026-11-18T12:00:00Z");
export const person = {
  urlSlug: "Example-Member",
  bioguideId: "E000001",
  displayName: "Example Member",
  chamber: "HOUSE",
  party: "Independent",
  state: "CA",
  former: true,
  servedUntil: "2021",
};
const q = politicianQuery(
  new URLSearchParams("slug=Example-Member&bioguideId=E000001"),
);
test("directory preserves canonical identities and former status, bounded query", () => {
  const d = projectDirectory(
    { data: { members: [person], totalCount: 1 } },
    politicianQuery(new URLSearchParams()),
    now,
  );
  assert.deepEqual(d.members[0], person);
  assert.throws(() =>
    politicianQuery(new URLSearchParams("slug=../x&bioguideId=E000001")),
  );
  assert.throws(() => politicianQuery(new URLSearchParams("offset=1001")));
  assert.throws(() => politicianQuery(new URLSearchParams("q=x&q=y")));
  assert.throws(() =>
    projectDirectory(
      { data: { members: [{ ...person, former: "false" }], totalCount: 1 } },
      politicianQuery(new URLSearchParams()),
      now,
    ),
  );
});
test("member identity anchored to verified directory; ranges and dates remain distinct", () => {
  const d = projectMember(
    {
      isPreview: false,
      totalCount: 1,
      data: {
        profile: { ...person, totalTrades: 1 },
        recentTrades: [
          {
            ticker: "ABC",
            transactionType: "PURCHASE",
            transactionDate: "2021-01-02",
            disclosureDate: "2021-02-01",
            amountRange: "Over $50,000,000",
            amountMin: 50000000,
            amountMax: null,
            owner: "Spouse",
          },
        ],
        topTickers: ["ABC"],
      },
    },
    q,
    person,
    now,
  );
  assert.equal(d.trades[0].amountMax, null);
  assert.equal(d.trades[0].transactionDate, "2021-01-02");
  assert.equal(d.trades[0].disclosureDate, "2021-02-01");
  assert.equal(d.member.former, true);
  assert.throws(() =>
    projectMember(
      {
        isPreview: false,
        totalCount: 0,
        data: {
          profile: { ...person, bioguideId: "X000001" },
          recentTrades: [],
          topTickers: [],
        },
      },
      q,
      person,
      now,
    ),
  );
});
test("missing dates are not invented, impossible ranges and identity cross-contamination rejected", () => {
  const raw = {
    isPreview: false,
    totalCount: 1,
    data: {
      profile: person,
      recentTrades: [
        {
          ticker: "ABC",
          transactionType: "SALE",
          amountRange: "$1 - $10",
          amountMin: 10,
          amountMax: 1,
        },
      ],
      topTickers: [],
    },
  };
  assert.throws(() => projectMember(raw, q, person, now));
  raw.data.recentTrades[0] = {
    ticker: "ABC",
    transactionType: "SALE",
    amountRange: "$0 - $1,000",
    amountMin: 0,
    amountMax: 1000,
  };
  const d = projectMember(raw, q, person, now);
  assert.equal(d.trades[0].transactionDate, null);
  assert.equal(d.trades[0].amountMin, 0);
  raw.data.recentTrades[0].bioguideId = "X000001";
  assert.throws(() => projectMember(raw, q, person, now));
});
test("preview arrays remain usable without pretending profile/total coverage", () => {
  const d = projectMember(
    {
      isPreview: true,
      data: [
        {
          ticker: "ABC",
          bioguideId: person.bioguideId,
          transactionType: "PURCHASE",
          amountRange: "Not supplied",
        },
      ],
    },
    q,
    person,
    now,
  );
  assert.equal(d.isPreview, true);
  assert.equal(d.totalCount, null);
  assert.equal(d.trades.length, 1);
  assert.equal(d.canNext, false);
});

test("preview fallback needs positive identity and must not pretend requested paging", () => {
  const raw = { isPreview: true, data: [{ ticker: "ABC" }] };
  assert.throws(() => projectMember(raw, q, person, now));
  raw.data[0].bioguideId = person.bioguideId;
  assert.throws(() => projectMember(raw, { ...q, offset: 50 }, person, now));
  assert.throws(() =>
    projectDirectory(
      { isPreview: "false", data: { members: [person], totalCount: 1 } },
      politicianQuery(new URLSearchParams()),
      now,
    ),
  );
});
