import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const migration =
    "supabase/migrations/20261118082354_auryn_sentisense_provider_guard.sql",
  a = "a".repeat(64),
  c = "c".repeat(64),
  d = "d".repeat(64);
async function setup() {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  await db.exec(fs.readFileSync(migration, "utf8"));
  return db;
}
async function reserve(db, key = c, max = 3) {
  return (
    await db.query("select public.auryn_sentisense_reserve($1,$2,$3) result", [
      a,
      key,
      max,
    ])
  ).rows[0].result;
}
test("actual SQL shared account reservation caps concurrent requests across keys", async () => {
  const db = await setup();
  try {
    const result = await Promise.all(
      Array.from({ length: 12 }, (_, i) => reserve(db, i % 2 ? c : d)),
    );
    assert.equal(result.filter((r) => r.allowed).length, 3);
    assert.equal(
      (
        await db.query(
          "select used from public.auryn_sentisense_buckets where key=$1",
          [a],
        )
      ).rows[0].used,
      3,
    );
  } finally {
    await db.close();
  }
});
test("cooldown is shared, monotonic, and survives a new caller; expiry restores permits", async () => {
  const db = await setup();
  try {
    await db.query("select public.auryn_sentisense_cooldown($1,$2,60)", [a, c]);
    assert.equal((await reserve(db, d)).allowed, false);
    await db.query("select public.auryn_sentisense_cooldown($1,$2,1)", [a, d]);
    assert.ok((await reserve(db, c)).retryAfterSeconds > 50);
    await db.exec(
      "update public.auryn_sentisense_buckets set cooldown_until=clock_timestamp()-interval '1 second',window_until=clock_timestamp()-interval '1 second'",
    );
    assert.equal((await reserve(db, d)).allowed, true);
  } finally {
    await db.close();
  }
});
test("limit cannot be raised in-window, anonymous users cannot reserve or inspect hash buckets", async () => {
  const db = await setup();
  try {
    await reserve(db, c, 1);
    assert.equal((await reserve(db, d, 20)).allowed, false);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(() => reserve(db));
      await assert.rejects(() =>
        db.query("select * from public.auryn_sentisense_buckets"),
      );
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    assert.equal((await reserve(db)).allowed, false);
  } finally {
    await db.close();
  }
});
test("SQL rejects malformed identities and bounds", async () => {
  const db = await setup();
  try {
    for (const args of [
      ["raw-key", c, 20],
      [a, c, 0],
      [a, c, 2001],
      [null, c, 20],
    ])
      await assert.rejects(() =>
        db.query("select public.auryn_sentisense_reserve($1,$2,$3)", args),
      );
    await assert.rejects(() =>
      db.query("select public.auryn_sentisense_cooldown($1,$2,86401)", [a, c]),
    );
  } finally {
    await db.close();
  }
});

test("separate transport instances share actual SQL budget and provider cooldown", async () => {
  const { createProviderFetch, providerConfig } = await import(
    "../lib/sentisense-provider-core.ts"
  );
  const db = await setup();
  let sent = 0;
  const deps = {
    config: () =>
      providerConfig({
        SENTISENSE_SHARED_GUARD: "required",
        SENTISENSE_REQUESTS_PER_MINUTE: "3",
      }),
    reserve: async (s, c) =>
      (
        await db.query(
          "select public.auryn_sentisense_reserve($1,$2,$3) result",
          [s.account, s.credential, c.max],
        )
      ).rows[0].result,
    cooldown: async (s, n) => {
      await db.query("select public.auryn_sentisense_cooldown($1,$2,$3)", [
        s.account,
        s.credential,
        n,
      ]);
    },
  };
  try {
    const instances = [createProviderFetch(deps), createProviderFetch(deps)];
    await instances[0](
      "https://app.sentisense.ai/api/v1/stocks/ABC/profile",
      { headers: { "X-SentiSense-API-Key": "fixture-key-one" } },
      async () => {
        sent++;
        return new Response("", {
          status: 429,
          headers: { "retry-after": "30" },
        });
      },
    );
    const blocked = await instances[1](
      "https://app.sentisense.ai/api/v1/earnings/recent",
      { headers: { "X-SentiSense-API-Key": "fixture-key-two" } },
      async () => {
        sent++;
        return new Response();
      },
    );
    assert.equal(blocked.status, 429);
    assert.equal(sent, 1);
    const stored = JSON.stringify(
      (await db.query("select * from public.auryn_sentisense_buckets")).rows,
    );
    assert.equal(stored.includes("fixture-key"), false);
  } finally {
    await db.close();
  }
});
