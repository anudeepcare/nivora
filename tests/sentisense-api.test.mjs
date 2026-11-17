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
