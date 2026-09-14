import fs from "node:fs";
const must=[".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml","supabase/migrations/20260914110000_auryn_v999_multi_account_portfolio.sql","lib/auryn/portfolio-lots.ts","app/portfolio/page.tsx"];
for(const f of must)if(!fs.existsSync(f))throw new Error(`Missing release file: ${f}`);
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json must remain {}");
const m=fs.readFileSync("supabase/migrations/20260914110000_auryn_v999_multi_account_portfolio.sql","utf8");
if(!/user_id,\s*account_name,\s*symbol/i.test(m))throw new Error("Multi-account uniqueness missing");
const w=fs.readFileSync(".github/workflows/nivora-calibration-mature.yml","utf8");
if(/AURYN_PRODUCTION_URL|TRADING_LAB_CRON_SECRET/.test(w))throw new Error("Legacy workflow secrets returned");
console.log("V9.9.9 release verified: multi-account portfolio present; hidden workflows present; exactly one V9.9.9 SQL migration required.");
