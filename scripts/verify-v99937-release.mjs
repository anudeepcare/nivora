import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
for(const p of [".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml",".github/workflows/nivora-portfolio-learning.yml"]){const s=read(p);for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!s.includes(x))throw new Error(`${p} missing ${x}`);if(s.includes("AURYN_PRODUCTION_URL")||s.includes("TRADING_LAB_CRON_SECRET"))throw new Error(`${p} legacy env remains`);}
for(const p of ["app/api/calibration/mature/route.ts","app/api/model-health/mature/route.ts","app/api/portfolio/learn/route.ts"])if(!read(p).includes("process.env.CRON_SECRET||process.env.TRADING_LAB_CRON_SECRET"))throw new Error(`${p} auth precedence wrong`);
for(const p of ["auryn-v931-reliability.yml","auryn-v935-reliability.yml","nivora-market-scanner.yml","nivora-paper-trading.yml"])if(fs.existsSync(`.github/workflows/${p}`))throw new Error(`obsolete workflow remains ${p}`);
const v=read("components/premium/AurynResearchOverviewV2.tsx");for(const x of ["Possible new uptrend","Uptrend developing","Uptrend confirmed","Trend unclear","Downtrend risk increasing","What confirms this?","waveEvidenceParts"])if(!v.includes(x))throw new Error(`wave UX missing ${x}`);
console.log("AURYN V9.9.9.37 automation reliability + investor structure UX verification passed.");
