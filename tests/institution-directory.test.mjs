import test from "node:test";
import assert from "node:assert/strict";
import {
  institutionQuery,
  projectInstitutionPage,
} from "../lib/institution-directory.ts";
const query = (s = "") => institutionQuery(new URLSearchParams(s));
const profile = {
  isPreview: false,
  totalCount: 60,
  data: {
    filerCik: "0000000001",
    displayName: "Fund",
    latestReportDate: "2026-06-30",
    offset: 0,
    returnedCount: 1,
    holdingsCount: 60,
    holdings: [
      {
        ticker: "ABC",
        companyName: "ABC",
        shares: 10,
        valueUsd: 100,
        portfolioWeight: 1,
      },
    ],
  },
};
test("only bounded explicit pages, known parameters and pinned later quarters are accepted", () => {
  assert.equal(query().offset, 0);
  for (const s of [
    "offset=50",
    "offset=-1",
    "offset=1001",
    "offset=1",
    "q=x&q=y",
    "url=https://evil",
    "cik=../x",
    "q=" + "a".repeat(101),
    "quarter=2026Q5",
  ])
    assert.throws(() => query(s));
  assert.equal(query("offset=50&quarter=2026Q2").offset, 50);
  assert.equal(query("cik=1&offset=50&reportDate=2026-06-30").cik, "1");
});
test("profile identity, quarter and paging cannot silently drift", () => {
  const q = query("cik=1");
  assert.equal(projectInstitutionPage(profile, q).data.filerCik, "0000000001");
  assert.throws(() =>
    projectInstitutionPage(
      { ...profile, data: { ...profile.data, filerCik: "2" } },
      q,
    ),
  );
  assert.throws(() =>
    projectInstitutionPage(
      { ...profile, data: { ...profile.data, offset: 50 } },
      q,
    ),
  );
  assert.throws(() =>
    projectInstitutionPage(profile, query("cik=1&reportDate=2026-03-31")),
  );
});
test("preview is explicit and never paged; extra/private fields never pass", () => {
  const p = projectInstitutionPage(
    { ...profile, isPreview: true, data: { ...profile.data, secret: "x" } },
    query("cik=1"),
  );
  assert.equal(p.isPreview, true);
  assert.equal(p.canNext, false);
  assert.equal(p.data.secret, undefined);
  assert.throws(() =>
    projectInstitutionPage(
      { ...profile, isPreview: true },
      query("cik=1&offset=50&reportDate=2026-06-30"),
    ),
  );
});
test("finder preserves quarter, canonical CIK and snapshot meaning", () => {
  const r = projectInstitutionPage(
    {
      isPreview: false,
      data: {
        quarter: "2026Q2",
        totalCount: 80,
        offset: 0,
        limit: 50,
        institutions: [
          {
            cik: "1",
            displayName: "Fund",
            urlSlug: "Fund",
            totalValueUsd: 100,
            holdingsCount: 2,
          },
        ],
      },
    },
    query(),
  );
  assert.equal(r.quarter, "2026Q2");
  assert.equal(r.institutions[0].cik, "1");
  assert.equal(r.canNext, false, "short page cannot imply a next page");
});

test("next page requires complete supplied page and stops at local cap", () => {
  const rows = Array.from({ length: 50 }, (_, i) => ({
    ...profile.data.holdings[0],
    ticker: `S${i}`,
  }));
  const full = {
    ...profile,
    totalCount: 2000,
    data: { ...profile.data, returnedCount: 50, holdings: rows },
  };
  assert.equal(projectInstitutionPage(full, query("cik=1")).canNext, true);
  assert.equal(
    projectInstitutionPage(
      { ...full, data: { ...full.data, offset: 1000 } },
      query("cik=1&offset=1000&reportDate=2026-06-30"),
    ).canNext,
    false,
  );
  assert.throws(() =>
    projectInstitutionPage({ ...full, isPreview: "false" }, query("cik=1")),
  );
});

test("future quarters reject and invalid portfolio weights remain unavailable", () => {
  assert.throws(() => query("quarter=2099Q1"));
  assert.throws(() =>
    projectInstitutionPage(
      {
        isPreview: false,
        data: {
          quarter: "2099Q1",
          totalCount: 0,
          offset: 0,
          limit: 50,
          institutions: [],
        },
      },
      query(),
    ),
  );
  for (const weight of [-1, 150]) {
    const r = projectInstitutionPage(
      {
        ...profile,
        data: {
          ...profile.data,
          holdings: [{ ...profile.data.holdings[0], portfolioWeight: weight }],
        },
      },
      query("cik=1"),
    );
    assert.equal(r.data.holdings[0].portfolioWeight, null);
  }
});
