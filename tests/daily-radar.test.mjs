import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { radarUniverse, dailyRadarSnapshot } from "../lib/daily-radar.ts";
const day = new Date().toISOString().slice(0, 10);
function harness({
  auth = true,
  sampleOnly = false,
  eligible = true,
  fail = false,
  positions = [{ symbol: "AAA", asset_type: "stock" }],
  watched = [{ symbol: "BBB" }, { symbol: "CCC" }],
} = {}) {
  const calls = [],
    rows = new Map();
  const db = {
    from(table) {
      let op = "read",
        patch,
        filters = [];
      const query = {
        select() {
          return this;
        },
        eq(k, v) {
          filters.push([k, v]);
          return this;
        },
        limit() {
          return this;
        },
        in(k, v) {
          filters.push([k, v]);
          return this;
        },
        lt() {
          return this;
        },
        gt() {
          return this;
        },
        update(v) {
          op = "update";
          patch = v;
          return this;
        },
        delete() {
          op = "delete";
          return this;
        },
        then(resolve) {
          calls.push({ table, op, filters });
          if (table === "portfolio_positions")
            return Promise.resolve(resolve({ data: positions }));
          if (table === "watchlist_items")
            return Promise.resolve(resolve({ data: watched }));
          if (op === "update") {
            const symbol = filters.find(([k]) => k === "symbol")[1];
            rows.set(symbol, { ...rows.get(symbol), ...patch });
          }
          return Promise.resolve(
            resolve({
              data:
                table === "auryn_daily_radar"
                  ? [...rows.values()].filter(
                      (row) =>
                        !filters.some(
                          ([k, v]) =>
                            k === "symbol" &&
                            Array.isArray(v) &&
                            !v.includes(row.symbol),
                        ),
                    )
                  : [],
            }),
          );
        },
      };
      return query;
    },
    async rpc(name, args) {
      calls.push({ rpc: name, args });
      const old = rows.get(args.p_symbol);
      if (old?.status === "ready") return { data: [] };
      const row = {
        symbol: args.p_symbol,
        status: "pending",
        history: [],
        attempts: (old?.attempts ?? 0) + 1,
        lease_token: "lease",
        lease_until: new Date(Date.now() + 90000).toISOString(),
      };
      rows.set(row.symbol, row);
      return { data: [row] };
    },
  };
  class HttpError extends Error {
    constructor(m, status = 400) {
      super(m);
      this.status = status;
    }
  }
  const bindings = {
    createClient: () => db,
    requestAccess: async () => ({ sampleOnly }),
    requireFeature: () => {
      if (!eligible) throw new HttpError("feature unavailable", 403);
    },
    allowMarketUser: async () => {
      calls.push({ allowance: true });
      return true;
    },
    account: async () => {
      if (!auth) throw new HttpError("sign in", 401);
      return { user: { id: "owner" }, db };
    },
    failure: (e) => ({ status: e.status ?? 503, error: e.message }),
    HttpError,
    limit: async () => {},
    privateJson: (x) => x,
    radarUniverse,
    dailyRadarSnapshot,
    eodHistory: async (symbol, range) => {
      calls.push({ history: symbol, range });
      if (fail)
        throw Object.assign(new Error("provider outage"), {
          status: 503,
          seconds: 600,
        });
      return [
        {
          time: "2026-01-02",
          open: 10,
          high: 11,
          low: 9,
          close: 10,
          volume: 1,
        },
      ];
    },
  };
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/daily-radar/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export /, ""))
    .join("\n");
  const js = ts.transpileModule(body, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-placeholder";
  const route = new Function(
    ...Object.keys(bindings),
    js + ";return {GET,POST}",
  )(...Object.values(bindings));
  return { route, calls, rows };
}
test("universe unions owned holdings and watchlist, excludes cash/unsupported without dropping denominator", () => {
  assert.deepEqual(
    radarUniverse(
      [
        { symbol: "AAA", asset_type: "stock" },
        { symbol: "USD", asset_type: "cash" },
      ],
      [{ symbol: "AAA" }, { symbol: "BBB" }, { symbol: "BTC/USD" }],
    ),
    { symbols: ["AAA", "BBB"], requested: 3, excluded: 1 },
  );
});
test("snapshots retain exact partial progress and cooldown; never call missing evidence ready", () => {
  const universe = { symbols: ["AAA", "BBB"], requested: 2, excluded: 0 };
  const now = Date.now();
  const result = dailyRadarSnapshot(
    day,
    universe,
    [
      {
        symbol: "AAA",
        status: "pending",
        history: [],
        retryAt: new Date(now + 600000).toISOString(),
        issue: "source paused",
      },
    ],
    now,
  );
  assert.equal(result.pending, 2);
  assert.equal(result.ready, 0);
  assert.equal(result.retryAfterSeconds, 600);
});
test("GET reads private saved snapshot only, POST advances at most two actual owned symbols and subsequent calls reuse ready rows", async () => {
  const h = harness();
  const request = new Request("http://local/api/daily-radar?symbols=EVIL");
  const initial = await h.route.GET(request);
  assert.equal(initial.pending, 3);
  assert.equal(h.calls.filter((c) => c.history).length, 0);
  const first = await h.route.POST(request);
  assert.equal(first.ready, 2);
  assert.equal(first.pending, 1);
  assert.deepEqual(
    h.calls.filter((c) => c.history).map((c) => c.history),
    ["AAA", "BBB"],
  );
  await h.route.POST(request);
  await h.route.POST(request);
  assert.equal(h.calls.filter((c) => c.history).length, 3);
  assert.ok(
    h.calls
      .filter((c) => c.table)
      .every((c) =>
        c.filters.some(([k, v]) => k === "user_id" && v === "owner"),
      ),
  );
  assert.ok(
    h.calls
      .filter((c) => c.rpc)
      .every((c) => c.args.p_user === "owner" && c.args.p_day === day),
  );
});
test("authentication and provider cooldown prevent unwanted history fanout", async () => {
  const no = harness({ auth: false });
  assert.equal((await no.route.POST(new Request("http://local"))).status, 401);
  assert.equal(no.calls.length, 0);
  const h = harness({ fail: true });
  let result = await h.route.POST(new Request("http://local"));
  assert.equal(h.calls.filter((c) => c.history).length, 1);
  assert.equal(result.ready, 0);
  assert.ok(result.retryAfterSeconds >= 599);
  result = await h.route.POST(new Request("http://local"));
  assert.equal(h.calls.filter((c) => c.history).length, 1);
  assert.equal(result.pending, 3);
});
test("migration protects private cache and lease publication; client stops when unmounted and never submits symbols", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/202611180001_daily_radar.sql",
    "utf8",
  );
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all.*authenticated/);
  assert.match(sql, /using\(user_id=\(select auth.uid\(\)\)\)/);
  assert.match(sql, /lease_until<=clock_timestamp/);
  const route = fs.readFileSync("app/api/daily-radar/route.ts", "utf8");
  assert.match(route, /\.eq\("lease_token", lease.lease_token\)/);
  assert.match(route, /\.gt\("lease_until"/);
  assert.doesNotMatch(route, /reserveAccess|request.json/);
  const client = fs.readFileSync("components/DailyMarketRadar.tsx", "utf8");
  assert.match(client, /controller.abort/);
  assert.match(client, /clearTimeout/);
  assert.match(client, /while this page is open/);
});

test("foreign listings and explicit crypto positions never enter US weekday history jobs", () => {
  const result = radarUniverse(
    [{ symbol: "BTCUSD", asset_type: "crypto" }],
    [{ symbol: "VOD.L" }, { symbol: "AAA" }],
  );
  assert.deepEqual(result, { symbols: ["AAA"], requested: 3, excluded: 2 });
});

test("cached large-universe history responses are paginated, never resent in each continuation", async () => {
  const watched = Array.from({ length: 45 }, (_, i) => ({
    symbol: `T${String(i).padStart(3, "0")}`,
  }));
  const h = harness({ positions: [], watched });
  for (const { symbol } of watched)
    h.rows.set(symbol, {
      symbol,
      status: "ready",
      history: [
        {
          time: "2026-01-02",
          open: 10,
          high: 11,
          low: 9,
          close: 10,
          volume: 1,
        },
      ],
      observed_through: "2026-01-02",
    });
  const first = await h.route.GET(new Request("http://local/api/daily-radar"));
  assert.equal(first.ready, 45);
  assert.equal(first.rows.length, 20);
  assert.equal(first.nextCursor, 20);
  assert.equal(first.incremental, false);
  const second = await h.route.GET(
    new Request("http://local/api/daily-radar?cursor=20"),
  );
  assert.equal(second.rows.length, 20);
  assert.equal(second.nextCursor, 40);
  assert.equal(second.incremental, true);
  const last = await h.route.GET(
    new Request("http://local/api/daily-radar?cursor=40"),
  );
  assert.equal(last.rows.length, 5);
  assert.equal(last.nextCursor, null);
  assert.equal(h.calls.filter((c) => c.history).length, 0);
});

test("sample-only and unavailable feature accounts cannot read or fetch vendor history; cache GET spends no market allowance", async () => {
  for (const config of [{ sampleOnly: true }, { eligible: false }]) {
    const h = harness(config);
    assert.equal((await h.route.POST(new Request("http://local"))).status, 403);
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  await h.route.GET(new Request("http://local"));
  assert.equal(h.calls.filter((c) => c.allowance).length, 0);
  await h.route.POST(new Request("http://local"));
  assert.equal(h.calls.filter((c) => c.allowance).length, 1);
});

test("supported US aliases share one snapshot/benchmark weight; explicit venue suffix is canonicalized", () => {
  assert.deepEqual(
    radarUniverse(
      [{ symbol: "BRK.B", asset_type: "stock" }],
      [{ symbol: "BRK-B" }, { symbol: "AAPL.US" }, { symbol: "AAPL" }],
    ),
    { symbols: ["AAPL", "BRK-B"], requested: 2, excluded: 0 },
  );
  assert.deepEqual(
    radarUniverse([], [{ symbol: "VOD.L" }, { symbol: "VOD" }]),
    { symbols: ["VOD"], requested: 2, excluded: 1 },
  );
});
