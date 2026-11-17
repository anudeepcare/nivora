import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const owner = "00000000-0000-4000-8000-000000000001",
  friend = "00000000-0000-4000-8000-000000000002";
test("access tables and RPCs deny self-promotion; unique quotas, watch caps and audited grants survive direct writes", async () => {
  const d = new PGlite();
  try {
    await d.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.watchlist_items(id uuid primary key default gen_random_uuid(),user_id uuid,symbol text);
 grant select,insert,update,delete on public.watchlist_items to authenticated;
 insert into auth.users values('${owner}','owner@example.com'),('${friend}','friend@example.com');`);
    await d.exec(
      await fs.readFile(
        new URL(
          "../supabase/migrations/20261023130718_beta_access.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await d.exec("set role authenticated");
    await assert.rejects(d.query("select * from auryn_access_config"));
    await assert.rejects(
      d.query(`select auryn_access_reserve('${friend}','research','AAPL',1)`),
    );
    await d.exec("reset role;set role service_role");
    const reserve = (item) =>
      d.query("select auryn_access_reserve($1,'research',$2,1) as r", [
        friend,
        item,
      ]);
    assert.equal((await reserve("AAPL")).rows[0].r.allowed, true);
    assert.equal((await reserve("AAPL")).rows[0].r.used, 1);
    assert.equal((await reserve("MSFT")).rows[0].r.allowed, false);
    const parallel = await Promise.all([reserve("AAPL"), reserve("MSFT")]);
    assert.equal(parallel[1].rows[0].r.allowed, false);
    const manage = (action, target, body) =>
      d.query("select auryn_access_manage($1,$2,$3,$4)", [
        owner,
        action,
        target,
        JSON.stringify(body),
      ]);
    await manage("settings", null, {
      mode: "beta",
      freeWatchlist: 1,
      proWatchlist: 2,
      __enabled: true,
    });
    await d.exec(
      `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${friend}',false)`,
    );
    const add = (symbol) =>
      d.query("insert into watchlist_items(user_id,symbol) values($1,$2)", [
        friend,
        symbol,
      ]);
    await add("AAPL");
    await assert.rejects(add("MSFT"), /Watchlist allowance/);
    await d.exec("reset role;set role service_role");
    await manage("grant", friend, {
      email: "friend@example.com",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      cohort: "friends",
    });
    await d.exec("reset role;set role authenticated");
    await add("MSFT");
    await d.exec("reset role;set role service_role");
    await manage("revoke-cohort", null, { cohort: "friends" });
    await d.exec("reset role;set role authenticated");
    await assert.rejects(add("NVDA"), /Watchlist allowance/);
    await d.exec("reset role;set role service_role");
    assert.equal(
      (await d.query("select count(*)::int as n from auryn_access_audit"))
        .rows[0].n,
      3,
    );
    assert.equal(
      (
        await d.query(
          "select has_table_privilege('anon','auryn_beta_grants','SELECT') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await d.close();
  }
});
