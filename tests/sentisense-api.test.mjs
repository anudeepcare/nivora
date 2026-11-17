import test from "node:test";
import assert from "node:assert/strict";
import {
  createSentiSenseClient,
  sentiSenseTicker,
} from "../lib/sentisense-api.ts";
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
test("SentiSense calls fixed server endpoint with credential header and preserves fractional metrics", async () => {
  let request;
  const read = createSentiSenseClient({
    key: "test-key",
    fetcher: async (url, opts) => {
      request = { url, opts };
      return response({
        data: { asOf: "2026-11-16", unusual: [{ volOiRatio: 3.4 }] },
        isPreview: false,
      });
    },
  });
  const result = await read("AAPL.US", "options");
  assert.equal(
    request.url,
    "https://app.sentisense.ai/api/v1/stocks/AAPL/options/summary",
  );
  assert.equal(request.opts.headers["X-SentiSense-API-Key"], "test-key");
  assert.equal(result.data.unusual[0].volOiRatio, 3.4);
  assert.equal(result.asOf, "2026-11-16");
  assert.equal(JSON.stringify(result).includes("test-key"), false);
});
test("SentiSense validates identity and never aliases foreign/crypto listings", async () => {
  assert.equal(sentiSenseTicker("BRK-B"), "BRK.B");
  for (const s of ["VOD.L", "SHOP.TO", "BTC/USD", "../../AAPL"])
    assert.equal(sentiSenseTicker(s), null);
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: [{ ticker: "MSFT" }] }),
  });
  assert.equal((await read("AAPL", "earnings")).status, "subject-mismatch");
});
test("preview and sampleCompany are explicit; retrieval time is not evidence date", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({
        data: [{ ticker: "AAPL", reportDate: "2026-10-20" }],
        isPreview: true,
        sampleCompany: true,
      }),
  });
  const r = await read("AAPL", "earnings");
  assert.equal(r.status, "preview");
  assert.equal(r.sampleCompany, true);
  assert.equal(r.asOf, null);
});
test("status-first errors cannot expose provider error payload or become available", async () => {
  for (const [status, want] of [
    [401, "unauthorized"],
    [403, "restricted"],
    [404, "no-coverage"],
    [500, "unavailable"],
  ]) {
    const read = createSentiSenseClient({
      key: "x",
      fetcher: async () =>
        new Response("secret provider diagnostic", { status }),
    });
    const r = await read("AAPL", "consensus");
    assert.equal(r.status, want);
    assert.equal(r.data, null);
  }
});
test("rate limit pauses subsequent calls across datasets", async () => {
  let calls = 0;
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () => {
      calls++;
      return new Response("", {
        status: 429,
        headers: { "retry-after": "30" },
      });
    },
  });
  assert.equal((await read("AAPL", "earnings")).status, "rate-limited");
  assert.equal((await read("MSFT", "options")).status, "rate-limited");
  assert.equal(calls, 1);
});
test("missing options data and empty covered lists remain distinct", async () => {
  const a = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: null }),
  });
  assert.equal((await a("AAPL", "options")).status, "no-coverage");
  const b = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: [] }),
  });
  assert.equal((await b("AAPL", "earnings")).status, "available");
});
test("malformed contracts fail closed and missing key spends nothing", async () => {
  let calls = 0;
  const a = createSentiSenseClient({
    fetcher: async () => {
      calls++;
      return response({});
    },
  });
  assert.equal((await a("AAPL", "earnings")).status, "unavailable");
  assert.equal(calls, 0);
  const b = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: { unexpected: 123 } }),
  });
  assert.equal((await b("AAPL", "holders")).status, "invalid-response");
});
test("same request is deduplicated without reinterpreting document timestamps", async () => {
  let calls = 0;
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () => {
      calls++;
      return response({
        data: {
          documents: [{ published: 1794873600, sourceName: "Publisher" }],
          totalCount: 1,
        },
      });
    },
  });
  const [a, b] = await Promise.all([
    read("AAPL", "documents"),
    read("AAPL", "documents"),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.equal(a.data.documents[0].published, 1794873600);
});

test("expanded fixed datasets validate their documented collection and preserve entitlement uncertainty", async () => {
  const contracts = {
    consensusHistory: ["history", "/analyst/AAPL/consensus/history?limit=90"],
    analystCoverage: ["coverage", "/analyst/AAPL/coverage?lookbackDays=180"],
    earningsReactions: ["reactions", "/stocks/AAPL/earnings/reactions"],
    ownershipHistory: [
      "quarters",
      "/institutional/holders/AAPL/history?quarters=20",
    ],
    optionsHistory: ["series", "/stocks/AAPL/options/history?window=5y"],
    optionsIntraday: ["series", "/stocks/AAPL/options/intraday-history"],
    kpis: ["kpis", "/stocks/AAPL/kpis"],
  };
  for (const [id, [field, path]] of Object.entries(contracts)) {
    let url;
    const read = createSentiSenseClient({
      key: "x",
      fetcher: async (u) => {
        url = u;
        return response({
          data: { ticker: "AAPL", [field]: [] },
          totalCount: 25,
        });
      },
    });
    const result = await read("AAPL", id);
    assert.equal(result.status, "available", id);
    assert.equal(url, "https://app.sentisense.ai/api/v1" + path);
    assert.equal(result.entitlement, "unverified");
    assert.equal(result.commercialDisplay, "license-review-required");
    assert.equal(result.totalCount, 25);
  }
});
test("options intraday free preview null is preview not no coverage", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ isPreview: true, data: null }),
  });
  assert.equal((await read("AAPL", "optionsIntraday")).status, "preview");
});
test("historical ownership cannot substitute another share class", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: { ticker: "GOOGL", quarters: [] } }),
  });
  assert.equal(
    (await read("GOOG", "ownershipHistory")).status,
    "subject-mismatch",
  );
});
test("analyst actions keep missing split-adjusted targets null", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({
        data: [
          {
            ticker: "AAPL",
            actionType: "UPGRADE",
            priceTarget: null,
            priorPriceTarget: null,
          },
        ],
      }),
  });
  const r = await read("AAPL", "analystActions");
  assert.equal(r.status, "available");
  assert.equal(r.data[0].priceTarget, null);
});

test("earnings reactions documented bare object needs no invented data envelope", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({
        ticker: "NVDA",
        asOf: "2026-08-21",
        reactions: [
          { reportDate: "2026-05-20", timing: "AMC", movePct: -1.77 },
        ],
      }),
  });
  const r = await read("NVDA", "earningsReactions");
  assert.equal(r.status, "available");
  assert.equal(r.data.reactions[0].movePct, -1.77);
  assert.equal(r.asOf, "2026-08-21");
});
test("KPI date is provider refresh date not retrieval time", async () => {
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({
        data: { ticker: "AAPL", lastUpdated: "2026-07-23", kpis: [] },
      }),
  });
  assert.equal((await read("AAPL", "kpis")).asOf, "2026-07-23");
});

test("stock metadata and financial history use documented bare contracts", async () => {
  const cases = {
    profile: { ticker: "AAPL", kind: "STOCK" },
    fundamentalsCurrent: {
      ticker: "AAPL",
      available: false,
      reason: "no_data",
    },
    fundamentalsQuarterly: {
      ticker: "AAPL",
      timeframe: "quarterly",
      periods: [],
    },
    fundamentalsAnnual: { ticker: "AAPL", timeframe: "annual", periods: [] },
    shortInterest: {
      ticker: "AAPL",
      dataPoints: [
        { shortInterest: 10, daysToCover: 2, settlementDate: "2026-10-31" },
      ],
    },
    float: {
      ticker: "AAPL",
      freeFloat: null,
      freeFloatPercent: null,
      effectiveDate: null,
    },
    shortVolume: {
      ticker: "AAPL",
      dataPoints: [{ shortVolumeRatio: 45.2, date: "2026-11-10" }],
    },
    stockEtfs: [{ etfTicker: "QQQ", weightPct: 8.5, asOfDate: "2026-11-10" }],
    kpiTypes: [{ id: "units", name: "Units", chartType: "bar" }],
  };
  for (const [id, data] of Object.entries(cases)) {
    let url;
    const read = createSentiSenseClient({
      key: "x",
      fetcher: async (u) => {
        url = u;
        return response(data);
      },
    });
    const r = await read("AAPL", id);
    assert.equal(r.status, "available", id);
    assert.deepEqual(r.data, data);
    assert.equal(r.asOf, null);
    if (id === "fundamentalsQuarterly")
      assert.ok(url.endsWith("timeframe=quarterly&limit=40"));
    if (id === "fundamentalsAnnual")
      assert.ok(url.endsWith("timeframe=annual&limit=20"));
  }
});
test("new bare endpoints reject misplaced security and nonfinite ETF weight", async () => {
  for (const [id, body, want] of [
    ["profile", { ticker: "MSFT", kind: "STOCK" }, "subject-mismatch"],
    ["stockEtfs", [{ etfTicker: "QQQ", weightPct: 110 }], "invalid-response"],
    ["kpiTypes", { error: "no data" }, "invalid-response"],
  ]) {
    const read = createSentiSenseClient({
      key: "x",
      fetcher: async () => response(body),
    });
    assert.equal((await read("AAPL", id)).status, want);
  }
});
test("ticker stories use effective lookback and reject unrelated stories", async () => {
  let url;
  const row = {
    id: "story-1",
    cluster: { title: "Report", clusteredAt: 1780000000 },
    tickers: ["AAPL"],
  };
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async (u) => {
      url = u;
      return response([row]);
    },
  });
  assert.equal((await read("AAPL.US", "tickerStories")).status, "available");
  assert.equal(
    url,
    "https://app.sentisense.ai/api/v1/documents/stories?ticker=AAPL&filterHours=720&limit=20",
  );
  assert.equal(
    (await read("MSFT", "tickerStories")).status,
    "subject-mismatch",
  );
});
test("story detail enforces bounded identity and ticker membership without a generic proxy", async () => {
  let calls = 0;
  const detail = {
    id: "story-1",
    title: "Report",
    tickers: ["AAPL"],
    narrativeBody: "Evidence [doc1]",
    citationLinks: { doc1: "https://example.com/news" },
  };
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async (url) => {
      calls++;
      assert.equal(
        url,
        "https://app.sentisense.ai/api/v1/documents/stories/story-1",
      );
      return response(detail);
    },
  });
  assert.equal(
    (await read.readStory("AAPL", "../secret")).status,
    "invalid-request",
  );
  assert.equal((await read("AAPL", "storyDetail")).status, "invalid-request");
  assert.equal(calls, 0);
  assert.equal((await read.readStory("AAPL", "story-1")).status, "available");
  assert.equal(
    (await read.readStory("MSFT", "story-1")).status,
    "subject-mismatch",
  );
  detail.id = "other";
  assert.equal(
    (await read.readStory("TSLA", "story-1")).status,
    "subject-mismatch",
  );
});
test("tracked stock coverage has daily cache and validates bare string list", async () => {
  let time = 1780000000000,
    calls = 0;
  const read = createSentiSenseClient({
    key: "x",
    now: () => time,
    fetcher: async (url) => {
      calls++;
      assert.equal(url, "https://app.sentisense.ai/api/v1/stocks");
      return response(["AAPL", "BRK.B"]);
    },
  });
  const first = await read.trackedStocks();
  assert.equal(first.status, "available");
  assert.equal(first.symbol, "");
  assert.equal(first.asOf, null);
  time += 3600000;
  await read.trackedStocks();
  assert.equal(calls, 1);
  time += 86400000;
  await read.trackedStocks();
  assert.equal(calls, 2);
  const bad = createSentiSenseClient({
    key: "x",
    fetcher: async () => response(["AAPL", {}]),
  });
  assert.equal((await bad.trackedStocks()).status, "invalid-response");
});

test("ETF analyst aggregate preserves composition coverage and rejects wrong subject", async () => {
  const data = {
    ticker: "QQQ",
    asOfDate: "2026-11-16",
    computedAt: 1794860000,
    coverage: {
      holdingsCount: 100,
      holdingsCovered: 90,
      weightCovered: 92,
      partial: false,
    },
    weightedConsensus: {
      upsidePercent: 12.4,
      distribution: { BUY: 0.62, HOLD: 0.31, SELL: 0.07 },
    },
    topContributors: [{ ticker: "MSFT", contributionPp: 1.2 }],
  };
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async (url) => {
      assert.ok(
        url.endsWith("/etfs/QQQ/aggregates/analyst") ||
          url.endsWith("/etfs/SPY/aggregates/analyst"),
      );
      return response({ isPreview: false, data });
    },
  });
  const r = await read("QQQ", "etfAnalyst");
  assert.equal(r.status, "available");
  assert.equal(r.asOf, "2026-11-16");
  assert.equal(r.data.weightedConsensus.upsidePercent, 12.4);
  assert.equal((await read("SPY", "etfAnalyst")).status, "subject-mismatch");
});
test("KPI coverage uses fixed universe endpoint, daily cache, and validates rows", async () => {
  let calls = 0,
    time = 1780000000000;
  const read = createSentiSenseClient({
    key: "x",
    now: () => time,
    fetcher: async (url) => {
      calls++;
      assert.ok(url.endsWith("/stocks/with-kpis"));
      return response({
        count: 1,
        tickers: [
          {
            ticker: "AAPL",
            companyName: "Apple",
            lastUpdated: "2026-04-30",
            kpiCount: 0,
          },
        ],
      });
    },
  });
  assert.equal(typeof read.kpiCoverage, "function");
  const r = await read.kpiCoverage();
  assert.equal(r.status, "available");
  assert.equal(r.data.tickers[0].kpiCount, 0);
  time += 3600000;
  await read.kpiCoverage();
  assert.equal(calls, 1);
  assert.equal((await read("AAPL", "kpiCoverage")).status, "invalid-request");
  const bad = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({ count: 1, tickers: [{ ticker: "../bad", kpiCount: 2 }] }),
  });
  assert.equal((await bad.kpiCoverage()).status, "invalid-response");
});
test("options overview keeps separate dated boards, preview and null semantics", async () => {
  const data = {
    asOf: "2026-11-16",
    builtAt: 1794860000,
    coverageCount: 100,
    rows: [{ ticker: "AAPL", asOf: "2026-11-16", atmIv: 0.3 }],
    etfRows: [{ ticker: "SPY", asOf: "2026-11-13", ivRank1y: null }],
  };
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async (url) => {
      assert.ok(url.endsWith("/options/overview"));
      return response({ isPreview: true, totalCount: 100, data });
    },
  });
  assert.equal(typeof read.optionsOverview, "function");
  const r = await read.optionsOverview();
  assert.equal(r.status, "preview");
  assert.equal(r.data.etfRows[0].asOf, "2026-11-13");
  assert.equal(r.totalCount, 100);
  assert.equal(
    (await read("AAPL", "optionsOverview")).status,
    "invalid-request",
  );
  const empty = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ data: null }),
  });
  assert.equal((await empty.optionsOverview()).status, "no-coverage");
  const bad = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({ data: { ...data, rows: [{ ticker: "AAPL", asOf: "bad" }] } }),
  });
  assert.equal((await bad.optionsOverview()).status, "invalid-response");
});

test("ETF holdings preserves partial dated composition and venue-local ticker identity", async () => {
  const data = {
    ticker: "VEA",
    asOfDate: "2026-11-16",
    totalHoldings: 1,
    partial: true,
    totalKnownHoldings: 4000,
    holdings: [
      {
        ticker: "ROP",
        name: "Roche",
        weightPct: 2.1,
        exchange: "SIX Swiss Exchange",
        linkedTicker: null,
      },
    ],
  };
  const read = createSentiSenseClient({
    key: "x",
    fetcher: async (url) => {
      assert.match(url, /\/etfs\/(VEA|QQQ)\/holdings$/);
      return response(data);
    },
  });
  const r = await read("VEA", "etfHoldings");
  assert.equal(r.status, "available");
  assert.equal(r.asOf, "2026-11-16");
  assert.equal(r.data.partial, true);
  assert.equal(r.data.totalKnownHoldings, 4000);
  assert.equal(r.data.holdings[0].linkedTicker, null);
  assert.equal((await read("QQQ", "etfHoldings")).status, "subject-mismatch");
});
test("ETF holdings fails closed on missing dates or malformed weights and handles no coverage", async () => {
  for (const data of [
    { ticker: "QQQ", totalHoldings: 0, holdings: [] },
    {
      ticker: "QQQ",
      asOfDate: "2026-11-16",
      totalHoldings: 1,
      holdings: [{ ticker: "AAPL", weightPct: 101 }],
    },
  ]) {
    const read = createSentiSenseClient({
      key: "x",
      fetcher: async () => response(data),
    });
    assert.equal((await read("QQQ", "etfHoldings")).status, "invalid-response");
  }
  const empty = createSentiSenseClient({
    key: "x",
    fetcher: async () => response({ error: "not_found" }, 404),
  });
  assert.equal((await empty("QQQ", "etfHoldings")).status, "no-coverage");
  const zero = createSentiSenseClient({
    key: "x",
    fetcher: async () =>
      response({
        ticker: "QQQ",
        asOfDate: "2026-11-16",
        totalHoldings: 0,
        holdings: [],
      }),
  });
  assert.equal((await zero("QQQ", "etfHoldings")).status, "available");
});
test("institutional flows use one bounded universe endpoint and keep quarter coverage", async () => {
  let calls = 0;
  const read = createSentiSenseClient({
    key: "test",
    fetcher: async (url) => {
      calls++;
      assert.equal(
        url,
        "https://app.sentisense.ai/api/v1/institutional/flows?limit=20",
      );
      return response({
        isPreview: true,
        data: {
          reportDate: "2026-09-30",
          isPending: true,
          filerCount: 100,
          baselineFilerCount: 200,
          inflows: [{ ticker: "APP", netSharesChange: 0 }],
          outflows: [{ ticker: "MSFT", netSharesChange: -10 }],
        },
      });
    },
  });
  const result = await read.institutionalFlows();
  assert.equal(result.status, "preview");
  assert.equal(result.asOf, "2026-09-30");
  assert.equal(result.data.isPending, true);
  assert.equal(result.data.inflows[0].netSharesChange, 0);
  await read.institutionalFlows();
  assert.equal(calls, 1);
  assert.equal(
    (await read("APP", "institutionalFlows")).status,
    "invalid-request",
  );
});
test("institutional flows reject missing report dates and malformed changes", async () => {
  for (const data of [
    { isPending: false, inflows: [], outflows: [] },
    {
      reportDate: "2026-09-30",
      isPending: false,
      inflows: [{ ticker: "APP", netSharesChange: "10" }],
      outflows: [],
    },
  ]) {
    const read = createSentiSenseClient({
      key: "test",
      fetcher: async () => response({ data }),
    });
    assert.equal((await read.institutionalFlows()).status, "invalid-response");
  }
});
test("activist discovery selects completed quarter, caches two fixed reads, never emits pending quarter", async () => {
  const urls = [];
  const read = createSentiSenseClient({
    key: "test",
    now: () => Date.parse("2026-11-17"),
    fetcher: async (url) => {
      urls.push(url);
      return response(
        url.endsWith("/quarters")
          ? [
              { reportDate: "2026-09-30", pending: true },
              {
                reportDate: "2026-06-30",
                pending: false,
                ownershipEligible: true,
              },
            ]
          : {
              isPreview: true,
              data: [
                {
                  filerName: "Fund",
                  ticker: "APP",
                  changeType: "NEW",
                  shares: 10,
                  valueUsd: 100,
                  sharesChange: 10,
                  sharesChangePct: 0,
                  reportDate: "2026-06-30",
                },
              ],
            },
      );
    },
  });
  const result = await read.institutionalActivists();
  assert.equal(result.status, "preview");
  assert.equal(result.asOf, "2026-06-30");
  assert.ok(urls[1].endsWith("/institutional/activist?reportDate=2026-06-30"));
  await read.institutionalActivists();
  assert.equal(urls.length, 2);
});
test("activist discovery fails closed without eligible quarter or on mismatched response quarter", async () => {
  let calls = 0;
  const pending = createSentiSenseClient({
    key: "test",
    fetcher: async () => {
      calls++;
      return response([{ reportDate: "2026-09-30", pending: true }]);
    },
  });
  assert.equal((await pending.institutionalActivists()).status, "no-coverage");
  assert.equal(calls, 1);
  const wrong = createSentiSenseClient({
    key: "test",
    fetcher: async (url) =>
      response(
        url.endsWith("/quarters")
          ? [{ reportDate: "2026-06-30", pending: false }]
          : {
              data: [
                {
                  filerName: "Fund",
                  ticker: "APP",
                  changeType: "NEW",
                  shares: 10,
                  valueUsd: 100,
                  sharesChange: 10,
                  sharesChangePct: 0,
                  reportDate: "2026-03-31",
                },
              ],
            },
      ),
  });
  assert.equal(
    (await wrong.institutionalActivists()).status,
    "invalid-response",
  );
});
test("institution CIK requests use fixed paged profile/history and reject another filer", async () => {
  const urls = [];
  const read = createSentiSenseClient({
    key: "test",
    fetcher: async (url) => {
      urls.push(url);
      return response({
        data: url.includes("/history")
          ? { filerCik: "0001067983", quarters: [{ reportDate: "2026-06-30" }] }
          : {
              filerCik: "0001067983",
              latestReportDate: "2026-06-30",
              holdings: [],
            },
      });
    },
  });
  assert.equal((await read.institution("1067983")).status, "available");
  assert.ok(
    urls[0].endsWith("/institutional/institution/1067983?limit=50&offset=0"),
  );
  assert.equal((await read.institution("1067983", true)).status, "available");
  assert.ok(
    urls[1].endsWith("/institutional/institution/1067983/history?quarters=8"),
  );
  assert.equal(
    (await read.institution("../../other")).status,
    "invalid-request",
  );
  assert.equal(urls.length, 2);
  const other = createSentiSenseClient({
    key: "test",
    fetcher: async () =>
      response({
        data: { filerCik: "123", latestReportDate: "2026-06-30", holdings: [] },
      }),
  });
  assert.equal((await other.institution("1067983")).status, "subject-mismatch");
});
