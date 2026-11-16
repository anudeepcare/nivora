import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("durable preview cache is service-role-only, expiring, bounded and denial-aware", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;",
    );
    for (const f of [
      "20261019140303_shared_market_guard.sql",
      "20261107140000_auryn_shared_request_limits.sql",
      "20261116001606_auryn_preview_target_cache.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + f, import.meta.url),
          "utf8",
        ),
      );
    await db.exec("set role service_role");
    const key = "sentisense:preview:v1:" + "a".repeat(64) + ":IREN",
      denial = "b".repeat(64);
    const value = {
      symbol: "IREN",
      currency: "USD",
      source: "SentiSense",
      sourceField: "consensus.targetMean",
      timestampBasis: "dataset-refresh",
      updatedAt: new Date().toISOString(),
      low: 23,
      target: 56.69,
      high: 139,
      analysts: 19,
      secret: "should-not-persist",
    };
    const write = async (k = key, v = value, expiry = "1 hour") =>
      db.query(
        `select public.auryn_preview_targets_write($1,$2,clock_timestamp()+$3::interval) as ok`,
        [k, JSON.stringify(v), expiry],
      );
    const read = async () =>
      (
        await db.query(
          "select public.auryn_preview_targets_read($1,$2) as value",
          [key, denial],
        )
      ).rows[0].value;
    assert.equal(await read(), null);
    await write();
    const saved = await read();
    assert.equal(saved.value.target, 56.69);
    assert.equal(saved.value.secret, undefined);
    assert.equal(
      (
        await db.query(
          "select count(*) as n from auryn_product_private.market_days",
        )
      ).rows[0].n,
      0,
    );
    await assert.rejects(write(key, value, "25 hours"), /Invalid preview/);
    await assert.rejects(write(key, { ...value, low: 1000 }), /Invalid target/);
    await assert.rejects(write("eodhd:other"), /Invalid preview/);
    await db.query(
      "insert into public.auryn_request_limits(key,count,expires_at) values($1,123,clock_timestamp()+interval '1 hour')",
      [denial],
    );
    assert.equal(await read(), null);
    await db.query("delete from public.auryn_request_limits where key=$1", [
      denial,
    ]);
    assert.ok(await read());
    await db.query(
      "update auryn_product_private.market_cache set expires_at=clock_timestamp()-interval '1 second' where key=$1",
      [key],
    );
    assert.equal(await read(), null);
    assert.equal(
      (
        await db.query(
          "select count(*) as n from auryn_product_private.market_cache where key=$1",
          [key],
        )
      ).rows[0].n,
      0,
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec("reset role;set role " + role);
      await assert.rejects(read(), /permission denied/);
      await assert.rejects(write(), /permission denied/);
    }
  } finally {
    await db.close();
  }
});

test("Pro shared burst contract is supported by deployed SQL minimum window", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261107140000_auryn_shared_request_limits.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec("set role service_role");
    const reserve = async (max, window) =>
      (
        await db.query(
          "select public.auryn_request_allow($1,$2,$3) as allowed",
          ["c".repeat(64), max, window],
        )
      ).rows[0].allowed;
    assert.equal(await reserve(4, 1000), true);
    assert.equal(await reserve(4, 1000), true);
    assert.equal(await reserve(4, 1000), true);
    assert.equal(await reserve(4, 1000), true);
    assert.equal(await reserve(4, 1000), false);
    await assert.rejects(reserve(1, 250), /invalid/i);
  } finally {
    await db.close();
  }
});
