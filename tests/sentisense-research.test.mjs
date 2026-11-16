import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSentiSenseFundamentals,
  fetchSentiSenseFundamentals,
} from "../lib/sentisense-research.ts";
const observed = "2026-11-16T00:00:00Z";
const profile = {
  ticker: "APP",
  name: "AppLovin",
  currency: "usd",
  primaryExchange: "XNAS",
  sector: "Technology",
  lastUpdated: 1794787200,
};
const period = (end, extra = {}) => ({
  ticker: "APP",
  periodEndDate: end,
  filingDate: "2026-11-01",
  fiscalPeriod: "Q3",
  fiscalYear: "2026",
  periodMonths: 3,
  reportedCurrency: "USD",
  revenue: 123,
  epsDiluted: 2,
  weightedAverageSharesDiluted: 55,
  sharesOutstanding: 99,
  fetchedAt: 1794787200,
  ...extra,
});
const history = (rows, timeframe = "quarterly") => ({
  ticker: "APP",
  timeframe,
  periods: rows,
});
const normalize = (extra) =>
  normalizeSentiSenseFundamentals(
    "APP",
    {
      profile,
      quarterly: history([period("2026-09-30"), period("2026-06-30")]),
      ...extra,
    },
    observed,
  );
test("maps filed periods, explicit diluted basis, not deprecated outstanding shares", () => {
  const out = normalize();
  const revenue = out.facts.find((x) => x.metric === "revenue");
  assert.equal(revenue.value, 123);
  assert.equal(revenue.start, "2026-07-01");
  assert.equal(revenue.scope, "quarterly");
  assert.equal(
    out.facts.some((x) => x.metric === "shares"),
    false,
  );
  assert.equal(out.facts.find((x) => x.metric === "eps").unit, "USD/shares");
  assert.equal(out.facts.find((x) => x.metric === "weightedShares").value, 55);
});
test("unknown currency and missing span never become USD quarter facts", () => {
  const out = normalize({
    quarterly: history([
      period("2026-09-30", { reportedCurrency: null }),
      period("2026-06-30"),
    ]),
  });
  assert.equal(out.facts.length, 0);
  const half = normalize({
    quarterly: history([
      period("2026-09-30", { periodMonths: 6 }),
      period("2026-03-31"),
    ]),
  });
  assert.equal(half.facts.length, 0);
});
test("foreign reporting currency preserved and trading currency not substituted", () => {
  const out = normalize({
    quarterly: history([
      period("2026-09-30", { reportedCurrency: "EUR" }),
      period("2026-06-30", { reportedCurrency: "EUR" }),
    ]),
  });
  assert.equal(out.facts[0].currency, "EUR");
  assert.equal(out.company.currency, "USD");
});
test("null values, positive capex and basic EPS are not invented substitutes", () => {
  const out = normalize({
    quarterly: history([
      period("2026-09-30", {
        revenue: null,
        capitalExpenditure: 10,
        epsDiluted: null,
        epsBasic: 5,
      }),
      period("2026-06-30"),
    ]),
  });
  assert.equal(
    out.facts.some((x) => ["revenue", "eps", "capex"].includes(x.metric)),
    false,
  );
});
test("cross-symbol and future statements are rejected", () => {
  assert.throws(() => normalize({ profile: { ...profile, ticker: "NBIS" } }));
  const out = normalize({
    quarterly: history([period("2027-01-01"), period("2026-06-30")]),
  });
  assert.equal(out.facts.length, 0);
});
test("analyst fiscal end distinct from announcement date; preview and wrong share-class withheld", () => {
  const payload = {
    isPreview: false,
    data: {
      ticker: "APP",
      estimates: [
        {
          periodType: "NEXT_YEAR",
          periodLabel: "+1y",
          fiscalPeriodEnd: "2027-12-31",
          estimateMean: 5,
          revenueMean: 1000,
        },
      ],
      surprises: [
        {
          reportDate: "2026-11-01",
          actualEps: 2,
          estimateEps: 1,
          surprisePct: null,
          surprisePercent: 1,
          surpriseFlag: "OUTSIZED",
        },
      ],
    },
  };
  const out = normalize({ estimates: payload });
  assert.equal(out.evidence.estimates[0].date, "2027-12-31");
  assert.equal(out.evidence.estimates[0].currency, "USD");
  assert.equal(out.evidence.earnings[0].surprise, null);
  assert.equal(
    normalize({ estimates: { ...payload, isPreview: true } }).evidence.estimates
      .length,
    0,
  );
  assert.equal(
    normalize({
      estimates: { ...payload, data: { ...payload.data, ticker: "NBIS" } },
    }).evidence.estimates.length,
    0,
  );
});
test("unknown fiscal end not converted from report date", () => {
  const out = normalize({
    estimates: {
      data: {
        ticker: "APP",
        estimates: [
          {
            periodType: "CURRENT_QUARTER",
            periodLabel: "2026-11-17",
            fiscalPeriodEnd: null,
            estimateMean: 5,
          },
        ],
      },
    },
  });
  assert.equal(out.evidence.estimates.length, 0);
});
test("fetch only uses SentiSense paths and tolerates missing optional statements", async () => {
  const calls = [];
  const out = await fetchSentiSenseFundamentals(
    "APP",
    async (path, params) => {
      calls.push([path, params]);
      if (path.endsWith("/profile")) return profile;
      throw Error("no coverage");
    },
    observed,
  );
  assert.equal(out.company.name, "AppLovin");
  assert.equal(out.facts.length, 0);
  assert.equal(calls.length, 5);
  assert.ok(calls.every((x) => !x[0].includes("eod")));
});
test("current TTM never becomes reported annual or diluted EPS facts", () => {
  const out = normalize({
    current: {
      ticker: "APP",
      available: true,
      reportedCurrency: "USD",
      fetchedAt: 1794787200,
      quartersIncluded: 4,
      epsTTM: 8,
      revenueTTM: 500,
      peTTM: 10,
    },
  });
  assert.equal(out.evidence.highlights.RevenueTTM, 500);
  assert.equal(out.evidence.highlights.DilutedEpsTTM, undefined);
  assert.equal(
    out.facts.some((f) => f.value === 500),
    false,
  );
});
test("preserves source filing and maps capex absolute cash outflow", () => {
  const out = normalize({
    quarterly: history([
      period("2026-09-30", {
        capitalExpenditure: -10,
        lineSources: {
          revenue: {
            source: "SEC",
            accession: "0000320193-26-000071",
            filed: "2026-11-02",
          },
        },
      }),
      period("2026-06-30"),
    ]),
  });
  const revenue = out.facts.find((f) => f.metric === "revenue");
  assert.equal(revenue.filed, "2026-11-02");
  assert.ok(
    revenue.sourceUrl.startsWith(
      "https://www.sec.gov/Archives/edgar/data/320193/",
    ),
  );
  assert.equal(out.facts.find((f) => f.metric === "capex").value, 10);
  assert.equal(out.filings.length, 1);
});
test("missing or invalid filing dates never become today's dated facts", () => {
  for (const filingDate of [null, undefined, "", "2026-02-30"]) {
    const out = normalize({
      quarterly: history([
        period("2026-09-30", { filingDate, totalAssets: 99 }),
        period("2026-06-30", { filingDate }),
      ]),
    });
    assert.equal(out.facts.length, 0);
  }
});
test("research estimates use shared strict envelope, range and duplicate validation", () => {
  const row = {
    periodType: "NEXT_YEAR",
    periodLabel: "+1y",
    fiscalPeriodEnd: "2027-12-31",
    estimateLow: 1,
    estimateMean: 2,
    estimateHigh: 3,
    numberOfAnalysts: 4,
  };
  const envelope = {
    isPreview: false,
    data: { ticker: "APP", estimates: [row] },
  };
  assert.equal(normalize({ estimates: envelope }).evidence.estimates.length, 1);
  for (const bad of [
    { data: envelope.data },
    { ...envelope, data: { ...envelope.data, estimates: [row, row] } },
    {
      ...envelope,
      data: { ...envelope.data, estimates: [{ ...row, estimateLow: 4 }] },
    },
  ])
    assert.equal(normalize({ estimates: bad }).evidence.estimates.length, 0);
  const out = normalize({
    estimates: {
      ...envelope,
      data: { ...envelope.data, estimates: [{ ...row, numberOfAnalysts: -3 }] },
    },
  });
  assert.equal(out.evidence.estimates[0].analysts, null);
});

test("independent statement requests start without waiting for profile response", async () => {
  const calls = [];
  let resolveProfile;
  const gate = new Promise(resolve => { resolveProfile = resolve; });
  const run = fetchSentiSenseFundamentals("APP", async (path) => {
    calls.push(path);
    if (path.endsWith("/profile")) return gate;
    return {};
  }, observed);
  await Promise.resolve();
  const started = calls.length;
  resolveProfile(profile);
  await run;
  assert.equal(started, 5);
});

test("stable reported statements use a longer cache than current fundamentals", async () => {
  const ttls = [];
  await fetchSentiSenseFundamentals("APP", async (path, _params, ttl) => {
    ttls.push([path,ttl]);
    return path.endsWith("/profile") ? profile : {};
  },observed);
  assert.deepEqual(ttls.filter(([p])=>p === "stocks/fundamentals/history").map(([,ttl])=>ttl),[3600,3600]);
  assert.equal(ttls.find(([p])=>p === "stocks/fundamentals/current")[1],300);
});
