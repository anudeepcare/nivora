import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { bulkPriceDay } from "../lib/bulk-radar.ts";
test("actual publisher stores50000row compact-string envelope and second acquisition costs no quota", async () => {
  const d = new PGlite();
  try {
    await d.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;",
    );
    await d.exec(
      fs.readFileSync(
        "supabase/migrations/20261019140303_shared_market_guard.sql",
        "utf8",
      ),
    );
    const rows = Array.from({ length: 50000 }, (_, i) => ({
      code: `T${i}`,
      exchange_short_name: "US",
      date: "2026-11-17",
      open: 100,
      high: 101,
      low: 99,
      close: 100,
      volume: 1234567,
    }));
    const value = bulkPriceDay(rows, "2026-11-17");
    const envelope = {
      payload: JSON.stringify(value),
      available: true,
      acquiredAt: "2026-11-18T00:00:00Z",
      error: null,
    };
    assert.ok(Buffer.byteLength(JSON.stringify(envelope)) < 4 * 1024 * 1024);
    const size = (
      await d.query("select pg_column_size($1::jsonb) size", [
        JSON.stringify(envelope),
      ])
    ).rows[0].size;
    assert.ok(size < 5242880, `${size}`);
    const acquire = async () =>
      (
        await d.query(
          "select auryn_market_acquire('bulk-day','credential',100,1000,0) value",
        )
      ).rows[0].value;
    const first = await acquire();
    assert.equal(first.used, 100);
    assert.equal(
      (
        await d.query(
          "select auryn_market_publish('bulk-day',$1,$2::jsonb,86400) ok",
          [first.lease, JSON.stringify(envelope)],
        )
      ).rows[0].ok,
      true,
    );
    const second = await acquire();
    assert.equal(second.status, "cached");
    assert.equal(JSON.parse(second.value.payload).rows.length, 50000);
    assert.equal(
      (await d.query("select used from auryn_product_private.market_days"))
        .rows[0].used,
      100,
    );
  } finally {
    await d.close();
  }
});
