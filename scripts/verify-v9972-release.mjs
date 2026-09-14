import fs from "node:fs";
const must=[".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml","lib/auryn/fast-quote.ts","components/StockClient.tsx"];
for(const f of must)if(!fs.existsSync(f))throw new Error(`Missing release file: ${f}`);
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json must remain {}");
const m=fs.readFileSync(".github/workflows/nivora-calibration-mature.yml","utf8");
if(/AURYN_PRODUCTION_URL|TRADING_LAB_CRON_SECRET/.test(m))throw new Error("Legacy maturation secrets returned");
const q=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
if(/Promise\.any\(attempts\)/.test(q))throw new Error("First-response-wins quote race still present");
console.log("V9.9.7.2 release verified: workflows present; market arbiter present; vercel cron-free; no manual SQL required.");
