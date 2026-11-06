import test from "node:test";
import assert from "node:assert/strict";
import {
  eodCallCost,
  eodUsage,
  safeMarketCap,
  canonicalMarketKey,
} from "../lib/market-policy.ts";
test("earnings release rollout cannot reuse a six-hour calendar cache entry", () => {
  const params = { symbols: "SOFI.US", from: "2026-10-27", to: "2026-11-03" };
  const legacy =
    "calendar/earnings?" +
    new URLSearchParams(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
    );
  const cache = new Map([[legacy, { actual: null }]]);
  assert.equal(
    cache.get(canonicalMarketKey("calendar/earnings", params)),
    undefined,
  );
  assert.equal(
    canonicalMarketKey("calendar/splits", params),
    "calendar/splits?" +
      new URLSearchParams(
        Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
      ),
  );
});
test("weighted budget accounts for expensive endpoints and multiple symbols", () => {
  assert.equal(eodCallCost("v1.1/fundamentals/APP.US"), 10);
  assert.equal(eodCallCost("news", { s: "APP.US" }), 5);
  assert.equal(
    eodCallCost("calendar/earnings", { symbols: "APP.US,IREN.US" }),
    2,
  );
  assert.equal(eodCallCost("unknown"), 10);
  assert.equal(eodCallCost("user"), 0);
});
test("actual account quota overrides assumptions and old-day usage resets", () => {
  const now = Date.parse("2026-10-19T14:00:00Z");
  assert.deepEqual(
    eodUsage(
      {
        apiRequests: "2880",
        apiRequestsDate: "2026-10-19",
        dailyRateLimit: "10000",
      },
      now,
    ),
    { limit: 10000, used: 2880, date: "2026-10-19" },
  );
  assert.equal(safeMarketCap(9000, 10000), 8000);
  assert.equal(
    eodUsage({ apiRequests: "bad", dailyRateLimit: 10000 }, now),
    null,
  );
  assert.equal(
    eodUsage(
      {
        apiRequests: 4000,
        apiRequestsDate: "2026-10-18",
        dailyRateLimit: 10000,
      },
      now,
    ).used,
    0,
  );
  assert.equal(
    canonicalMarketKey("x", { b: "2", a: "1" }),
    canonicalMarketKey("x", { a: "1", b: "2" }),
  );
});
