import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
test("Postgres migrations enforce account-scoped watches, idempotency, and AI request budgets", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
   create table auth.users(id uuid primary key); insert into auth.users values('${a}'),('${b}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
   grant usage on schema auth to authenticated,anon;
   create table public.watchlists(id uuid primary key default gen_random_uuid(),user_id uuid not null,name text default 'My Watchlist',created_at timestamptz not null default now());
   create table public.watchlist_items(id uuid primary key default gen_random_uuid(),user_id uuid not null,watchlist_id uuid not null references public.watchlists(id),symbol text not null,created_at timestamptz not null default now(),unique(watchlist_id,symbol));
   alter table watchlists enable row level security; alter table watchlist_items enable row level security;
   create policy own_list on watchlists for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
   create policy own_item on watchlist_items for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
   grant select,insert,update,delete on watchlists,watchlist_items to authenticated;
   alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`);
    for (const file of [
      "202610170000_workspace_base.sql",
      "202610170001_ai_budget.sql",
      "202610170002_watchlist_operation.sql",
      "202610170003_research_workspace.sql",
      "202610170004_paper_plans.sql",
      "202610170005_provider_budget.sql",
      "202610170006_position_imports.sql",
      "20261017071243_auryn_product_explicit_grants.sql",
    ])
      await db.exec(
        await readFile(
          new URL(`../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    assert.equal((await db.query("select has_table_privilege('anon','public.auryn_documents','SELECT') as allowed")).rows[0].allowed, false);
    assert.equal((await db.query("select has_table_privilege('authenticated','public.auryn_documents','TRUNCATE') as allowed")).rows[0].allowed, false);
    await db.exec(`set role authenticated; set request.uid='${a}'`);
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await db.query("select auryn_set_watch('MSFT',true) as ok")).rows[0]
          .ok,
        true,
      );
    assert.equal(
      (await db.query("select count(*)::int as n from watchlists")).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from watchlist_items")).rows[0]
        .n,
      1,
    );
    const list = (await db.query("select id from watchlists")).rows[0].id;
    await db.exec(`set request.uid='${b}'`);
    assert.equal(
      (await db.query("select count(*)::int as n from watchlist_items")).rows[0]
        .n,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into watchlist_items(user_id,watchlist_id,symbol) values('${b}','${list}','AAPL')`,
      ),
    );
    assert.equal(
      (await db.query("select auryn_set_watch('MSFT',false) as ok")).rows[0].ok,
      true,
    );
    await db.exec(`set request.uid='${a}'`);
    assert.equal(
      (await db.query("select count(*)::int as n from watchlist_items")).rows[0]
        .n,
      1,
    );
    for (let i = 0; i < 3; i++)
      assert.equal(
        (await db.query("select auryn_reserve_ai_request() as ok")).rows[0].ok,
        true,
      );
    assert.equal(
      (await db.query("select auryn_reserve_ai_request() as ok")).rows[0].ok,
      false,
    );
    await assert.rejects(
      db.query("select * from auryn_product_private.ai_daily_usage"),
    );
    await db.exec("reset role");
    await db.query(
      "update auryn_product_private.ai_daily_usage set used=100 where scope='global'",
    );
    await db.exec(`set role authenticated; set request.uid='${b}'`);
    assert.equal(
      (await db.query("select auryn_reserve_ai_request() as ok")).rows[0].ok,
      false,
    );
    await db.exec(`set role authenticated; set request.uid='${a}'`);
    await db.query(
      `insert into auryn_documents(user_id,kind,key,body) values('${a}','note','MSFT','{"thesis":"Durable cash flows"}')`,
    );
    await db.query(
      `insert into auryn_observations(user_id,symbol,snapshot_id,payload) values('${a}','MSFT','snapshot-1','{}')`,
    );
    await assert.rejects(
      db.query("update auryn_observations set payload='{}'"),
    );
    await db.exec(`set request.uid='${b}'`);
    assert.equal(
      (await db.query("select count(*)::int as n from auryn_documents")).rows[0]
        .n,
      0,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from auryn_observations"))
        .rows[0].n,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into auryn_documents(user_id,kind,key,body) values('${a}','note','AAPL','{}')`,
      ),
    );
    await assert.rejects(
      db.query(
        `insert into auryn_paper_plans(user_id,body) values('${b}','{}')`,
      ),
    );
    await assert.rejects(
      db.query(`select auryn_claim_paper(gen_random_uuid(),'${b}','2026-10')`),
    );
    await db.exec("set role service_role");
    for (let i = 0; i < 42; i++)
      assert.equal(
        (await db.query("select auryn_reserve_provider(true) as ok")).rows[0]
          .ok,
        true,
      );
    assert.equal(
      (await db.query("select auryn_reserve_provider(true) as ok")).rows[0].ok,
      false,
    );
    for (let i = 0; i < 13; i++)
      assert.equal(
        (await db.query("select auryn_reserve_provider(false) as ok")).rows[0]
          .ok,
        true,
      );
    assert.equal(
      (await db.query("select auryn_reserve_provider(false) as ok")).rows[0].ok,
      false,
    );
    const p1 = (
      await db.query(
        `insert into auryn_paper_plans(user_id,body,enabled) values('${a}','{}',true) returning id`,
      )
    ).rows[0].id;
    const p2 = (
      await db.query(
        `insert into auryn_paper_plans(user_id,body,enabled) values('${a}','{}',true) returning id`,
      )
    ).rows[0].id;
    const claimed = (
      await db.query(
        `select auryn_claim_paper('${p1}','${a}','2026-10') as run`,
      )
    ).rows[0].run;
    assert.equal(claimed.status, "reserved");
    await assert.rejects(
      db.query(`select auryn_claim_paper('${p2}','${a}','2026-10')`),
    );
    await db.query(`delete from auryn_paper_lock where run_id='${claimed.id}'`);
    await assert.rejects(
      db.query(`select auryn_claim_paper('${p1}','${a}','2026-10')`),
    );
    await db.query(
      `update auryn_paper_plans set enabled=false where id='${p2}'`,
    );
    await assert.rejects(
      db.query(`select auryn_claim_paper('${p2}','${a}','2026-10')`),
    );
    await db.exec(`set role authenticated;set request.uid='${b}'`);
    assert.equal(
      (await db.query("select count(*)::int as n from auryn_paper_runs"))
        .rows[0].n,
      0,
    );
    const importId = "00000000-0000-4000-8000-000000000009";
    const payload = JSON.stringify([
      { symbol: "MSFT", quantity: 2, cost: 100, currency: "USD" },
    ]);
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await db.query("select auryn_import_positions($1,$2::jsonb) as n", [
            importId,
            payload,
          ])
        ).rows[0].n,
        1,
      );
    assert.equal(
      (await db.query("select count(*)::int as n from portfolio_positions"))
        .rows[0].n,
      1,
    );
    await assert.rejects(
      db.query("select auryn_import_positions($1,$2::jsonb)", [
        importId,
        JSON.stringify([
          { symbol: "AAPL", quantity: 2, cost: 100, currency: "USD" },
        ]),
      ]),
    );
    await db.exec("set role anon");
    await assert.rejects(db.query("select auryn_reserve_ai_request()"));
    await assert.rejects(db.query("select auryn_set_watch('MSFT',true)"));
  } finally {
    await db.close();
  }
});
