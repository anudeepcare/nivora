import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import * as pure from "../lib/bulk-radar.ts";
import * as policy from "../lib/market-policy.ts";
import * as daily from "../lib/daily-radar.ts";
import * as pagination from "../lib/radar-pagination.ts";
import * as response from "../lib/market-response.ts";
import * as normalize from "../lib/eodhd-normalize.ts";
test("actual route→worker→provider→shared guard→SQL preserves500private rows, split rebuild, cache quota and failures", async () => {
  const sql = new PGlite();
  try {
    await sql.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;",
    );
    await sql.exec(
      fs.readFileSync(
        "supabase/migrations/20261019140303_shared_market_guard.sql",
        "utf8",
      ),
    );
    await sql.exec(
      fs.readFileSync(
        "supabase/migrations/20261118102559_auryn_bulk_radar_state.sql",
        "utf8",
      ),
    );
    await sql.exec(fs.readFileSync("supabase/migrations/20261118110617_auryn_bulk_radar_source_cooldown.sql", "utf8"));
    await sql.exec(
      "create table portfolio_positions(id integer,user_id uuid,symbol text,asset_type text);create table watchlist_items(id integer,user_id uuid,symbol text);",
    );
    const owner = "00000000-0000-4000-8000-000000000001",
      other = "00000000-0000-4000-8000-000000000002";
    const symbols = Array.from(
        { length: 500 },
        (_, i) => `T${String(i).padStart(4, "0")}`,
      ),
      target = pure.completedWeekday(),
      previous = pure.completedWeekday(Date.parse(target + "T12:00:00Z"));
    for (let i = 0; i < symbols.length; i++)
      await sql.query("insert into portfolio_positions values($1,$2,$3,$4)", [
        i,
        owner,
        symbols[i],
        "stock",
      ]);
    await sql.query("insert into watchlist_items values(999,$1,$2)", [
      other,
      "PRIVATEOTHER",
    ]);
    const db = {
      async rpc(name, args) {
        try {
          const entries = Object.entries(args),
            q = `select public.${name}(${entries.map(([k, v], i) => `${k} => $${i + 1}${v !== null && typeof v === "object" ? "::jsonb" : ""}`).join(",")}) value`;
          return {
            data: JSON.parse(JSON.stringify((
              await sql.query(
                q,
                entries.map(([, v]) =>
                  v !== null && typeof v === "object" ? JSON.stringify(v) : v,
                ),
              )
            ).rows[0].value)),
            error: null,
          };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },
      from(table) {
        let filters = [],
          order = "",
          range = [0, 999],
          selection = "*";
        const q = {
          select(s) {
            selection = s;
            return q;
          },
          eq(k, v) {
            filters.push([k, v]);
            return q;
          },
          in(k, v) {
            filters.push([k, v]);
            return q;
          },
          order(k) {
            order = k;
            return q;
          },
          range(a, b) {
            range = [a, b];
            return q;
          },
          limit(n) {
            range = [0, n - 1];
            return q;
          },
          async then(resolve) {
            try {
              const params = filters.map(([, v]) => v);
              let query = `select * from ${table}`;
              if (filters.length)
                query +=
                  " where " +
                  filters
                    .map(([k, v], i) =>
                      Array.isArray(v)
                        ? `${k}=any($${i + 1}::text[])`
                        : `${k}=$${i + 1}`,
                    )
                    .join(" and ");
              if (order) query += ` order by ${order}`;
              query += ` limit ${Math.min(100, range[1] - range[0] + 1)} offset ${range[0]}`;
              let rows = (await sql.query(query, params)).rows;
              if (selection.includes("snapshot->>"))
                rows = rows.map((r) => ({
                  symbol: r.symbol,
                  revision: r.revision,
                  issue: r.issue,
                  retry_at: r.retry_at,
                  ...Object.fromEntries(
                    [
                      "policy",
                      "historyAcquiredAt",
                      "actionsAcquiredAt",
                      "observedThrough",
                      "checkedThrough",
                    ].map((k) => [k, r.snapshot?.[k] ?? null]),
                  ),
                }));
              return resolve({ data: rows, error: null });
            } catch (e) {
              return resolve({ data: null, error: { message: e.message } });
            }
          },
        };
        return q;
      },
    };
    const env = {
      AURYN_BULK_RADAR_ENABLED: "true",
      EODHD_BULK_RADAR_ENTITLEMENT: "verified",
      AURYN_SHARED_MARKET_GUARD: "true",
      EODHD_API_KEY: "synthetic-only",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic",
      EODHD_DAILY_BUDGET: "1000",
    };
    let network = 0,
      deny = false;
    const fetcher = async (url, init) => {
      const u = new URL(url);
      assert.equal(u.origin, "https://eodhd.com");
      if (u.pathname === "/api/user")
        return Response.json({
          dailyRateLimit: 10000,
          apiRequests: 0,
          apiRequestsDate: new Date().toISOString().slice(0, 10),
        });
      network++;
      assert.equal(init.redirect, "error");
      assert.equal(u.searchParams.has("symbols"), false);
      if (deny) return new Response("denied", { status: 403 });
      if (u.pathname === "/api/eod-bulk-last-day/US")
        return Response.json(
          u.searchParams.get("type") === "splits"
            ? [{ code: symbols[0], exchange: "US", date: target, split: "2/1" }]
            : symbols.map((s) => ({
                code: s,
                exchange_short_name: "US",
                date: target,
                open: s === symbols[0] ? 50 : 100,
                high: s === symbols[0] ? 51 : 101,
                low: s === symbols[0] ? 49 : 99,
                close: s === symbols[0] ? 50 : 100,
                volume: 10,
              })),
        );
      if (u.pathname.startsWith("/api/eod/"))
        return Response.json([
          {
            date: previous,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 10,
          },
          { date: target, open: 50, high: 51, low: 49, close: 50, volume: 20 },
        ]);
      if (u.pathname.startsWith("/api/splits/"))
        return Response.json([{ date: target, split: "2/1" }]);
      throw Error("unexpected endpoint");
    };
    class HttpError extends Error {
      constructor(message, status = 503) {
        super(message);
        this.status = status;
      }
    }
    const modules = new Map();
    let access = true;
    const supplied = {
      "server-only": {},
      "node:crypto": crypto,
      "@supabase/supabase-js": { createClient: () => db },
      "./market-policy": policy,
      "./bulk-radar": pure,
      "./market-response": response,
      "./eodhd-normalize": normalize,
      "@/lib/daily-radar": daily,
      "@/lib/radar-pagination": pagination,
      "@/lib/eodhd": {
        eodHistory: () => {
          throw Error("legacy path must not run");
        },
      },
      "@/lib/access-server": {
        requestAccess: async () => ({ sampleOnly: false }),
        requireFeature: () => {
          if (!access) throw new HttpError("locked", 403);
        },
      },
      "@/lib/server": {
        account: async () => ({ user: { id: owner }, db }),
        failure: (e) => ({ error: e.message, status: e.status ?? 503 }),
        HttpError,
        limit: async () => {},
        privateJson: (x) => x,
      },
    };
    function load(name) {
      if (supplied[name]) return supplied[name];
      if (modules.has(name)) return modules.get(name);
      const file = name.startsWith("@/")
        ? name.slice(2) + ".ts"
        : "lib/" + name.replace("./", "") + ".ts";
      const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText;
      const module = { exports: {} };
      modules.set(name, module.exports);
      new Function("require", "module", "exports", "process", "fetch", source)(
        load,
        module,
        module.exports,
        { env },
        fetcher,
      );
      return module.exports;
    }
    const store = load("@/lib/bulk-radar-store.server").createBulkRadarStore(
        db,
      ),
      scope = crypto
        .createHash("sha256")
        .update(env.EODHD_API_KEY)
        .digest("hex");
    const acquired = new Date().toISOString();
    for (const symbol of symbols) {
      const lease = await store.claim(scope, symbol);
      const snapshot = pure.bootstrapRadar(
        symbol,
        [
          {
            date: previous,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 10,
          },
        ],
        [],
        acquired,
      );
      assert.equal(
        await store.publish(
          scope,
          symbol,
          lease.token,
          lease.revision,
          snapshot,
        ),
        true,
      );
    }
    const route = load("@/app/api/daily-radar/route");
    const req = () =>
      new Request("https://example.test/api/daily-radar", {
        method: "POST",
        body: JSON.stringify({ symbols: ["PRIVATEOTHER"] }),
      });
    access = false;
    assert.equal((await route.POST(req())).status, 403);
    assert.equal(network, 0);
    access = true;
    let out;
    for (let i = 0; i < 10; i++) {
      out = await route.POST(req());
      assert.equal(out.mode, "bulk-opt-in", JSON.stringify(out));
    }
    assert.equal(out.ready, 500);
    assert.equal(out.pending, 0);
    assert.equal(network, 4); //2bulk+2split-triggered full-history requests.
    assert.equal(
      (await sql.query("select used from auryn_product_private.market_days"))
        .rows[0].used,
      202,
    );
    const split = (await store.read(scope, [symbols[0]])).get(symbols[0]);
    assert.equal(split.revision, 2);
    assert.equal(split.snapshot.raw[0].close, 100);
    assert.equal(pure.radarCandles(split.snapshot)[0].close, 50);
    const get = await route.GET(
      new Request("https://example.test/api/daily-radar"),
    );
    assert.equal(get.rows.length, 50);
    assert.equal(get.requested, 500);
    assert.equal(network, 4);
    assert.ok(get.rows.every((r) => r.symbol !== "PRIVATEOTHER"));
    // Reintroduce a stale generation and expire shared cache, then deny source: no seedstorm or loss of lastgood.
    const lease = await store.claim(scope, symbols[1]);
    const old = pure.bootstrapRadar(
      symbols[1],
      [
        {
          date: previous,
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 10,
        },
      ],
      [],
      acquired,
    );
    await store.publish(scope, symbols[1], lease.token, lease.revision, old);
    await sql.exec(
      "update auryn_product_private.market_cache set expires_at='-infinity'",
    );
    deny = true;
    const failed = await route.POST(req());
    assert.equal(failed.pending, 1);
    assert.equal(network, 5);
    assert.equal(
      (await store.read(scope, [symbols[1]])).get(symbols[1]).snapshot.raw[0]
        .close,
      100,
    );
    await route.POST(req());
    assert.equal(network, 5);
    // Exhaust actual distributed allowance: no acquisition callback/network starts.
    await sql.exec(
      "update auryn_product_private.market_cache set expires_at='-infinity';update auryn_product_private.market_days set used=1000;update auryn_bulk_radar_state set retry_at=null;delete from auryn_bulk_radar_source",
    );
    await route.POST(req());
    assert.equal(network, 5);
    // A fresh500-cold universe outage remains paused across real GET/remount/POST.
    await sql.exec("delete from auryn_bulk_radar_state;delete from auryn_bulk_radar_source;update auryn_product_private.market_cache set expires_at='-infinity';update auryn_product_private.market_days set used=0");
    const coldFailure = await route.POST(req());
    assert.equal(coldFailure.pending,500);
    assert.equal(coldFailure.rows.length,0);
    assert.equal(coldFailure.sourceStatus,"unavailable");
    const callsAfterFailure=network;
    const usedAfterFailure=(await sql.query("select used from auryn_product_private.market_days")).rows[0].used;
    for (const method of ["GET","POST","GET"]) {
      const resumed=await route[method](method === "POST" ? req() : new Request("https://example.test/api/daily-radar"));
      assert.equal(resumed.sourceStatus,"unavailable");
      assert.equal(Date.parse(resumed.sourceRetryAt),Date.parse(coldFailure.sourceRetryAt));
      assert.ok(resumed.retryAfterSeconds>3500);
      assert.equal(resumed.pending,500);
      assert.equal(network,callsAfterFailure);
    }
    assert.equal((await sql.query("select used from auryn_product_private.market_days")).rows[0].used,usedAfterFailure);
  } finally {
    await sql.close();
  }
});
