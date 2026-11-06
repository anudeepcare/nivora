import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("valuation observations are append-only, point-in-time and service-role scoped", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
      alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20261028000000_valuation_observations.sql", import.meta.url), "utf8"));
    await db.exec("set role service_role");
    const inserted = await db.query(`insert into public.auryn_fact_observations(symbol,metric,period_end,period_type,value,unit,currency,source,filed_at) values('MSFT','revenue','2025-12-31','FY',100,'USD','USD','sec','2026-02-01') returning id`);
    await db.query(`insert into public.auryn_fact_observations(symbol,metric,period_end,period_type,value,unit,currency,source,filed_at,restates_id) values('MSFT','revenue','2025-12-31','FY',120,'USD','USD','sec','2026-04-01',$1)`, [inserted.rows[0].id]);
    const latest = await db.query(`select value from public.auryn_fact_observations where symbol='MSFT' and metric='revenue' and period_type='FY' and filed_at <= '2026-03-01' order by filed_at desc limit 1`);
    assert.equal(Number(latest.rows[0].value), 100);
    await assert.rejects(db.query(`update public.auryn_fact_observations set value=99`));
    await assert.rejects(db.query(`delete from public.auryn_fact_observations`));
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select count(*)::int as n from public.auryn_fact_observations"));
  } finally {
    await db.close();
  }
});

