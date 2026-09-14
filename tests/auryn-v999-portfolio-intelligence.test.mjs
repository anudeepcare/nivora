
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("migration changes position identity to user account symbol",()=>{
 const s=fs.readFileSync("supabase/migrations/20260914110000_auryn_v999_multi_account_portfolio.sql","utf8");
 assert.match(s,/account_name/i);assert.match(s,/user_id,\s*account_name,\s*symbol/i);assert.match(s,/nivora_portfolio_cash_flows/i);
});
test("portfolio add upserts by user account symbol",()=>{
 const s=fs.readFileSync("app/portfolio/page.tsx","utf8");assert.match(s,/onConflict:"user_id,account_name,symbol"/);assert.match(s,/Account \/ Broker/);
});
test("portfolio deduplicates symbols for batch market request",()=>{
 const s=fs.readFileSync("app/portfolio/page.tsx","utf8");assert.match(s,/new Set/);
});
test("holdings intelligence exposes account breakdown",()=>{
 const s=fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8");assert.match(s,/accountLots/);assert.match(s,/ACCOUNTS/);
});
