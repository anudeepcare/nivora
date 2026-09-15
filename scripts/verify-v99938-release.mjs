import fs from "node:fs";const read=p=>fs.readFileSync(p,"utf8");
const persist=read("lib/auryn/v995/persist-research.ts"),paper=read("app/api/trading-lab/run-paper/route.ts"),status=read("app/api/trading-lab/status/route.ts"),page=read("app/trading-lab/page.tsx"),portfolio=read(".github/workflows/nivora-portfolio-learning.yml");
for(const x of ["buildV935Provenance","AUTONOMOUS_RESEARCH_ENGINE_VERSION","v935:canonical"])if(!persist.includes(x))throw new Error(`canonical persistence missing ${x}`);
if(!paper.includes("AUTONOMOUS_RESEARCH_ENGINE_VERSION")||!status.includes("AUTONOMOUS_RESEARCH_ENGINE_VERSION"))throw new Error("Trading Lab is not reading autonomous canonical research");
for(const p of ["app/api/trading-lab/run-paper/route.ts","app/api/trading-lab/run-now/route.ts"])if(!read(p).includes("process.env.CRON_SECRET||process.env.TRADING_LAB_CRON_SECRET"))throw new Error(`${p} canonical auth precedence missing`);
for(const x of ["aurynLabCompactFunnel","aurynLabDecisionGrid","aurynLabCurrentRun","Historical paper orders"])if(!page.includes(x))throw new Error(`Trading Lab UX missing ${x}`);
if(!portfolio.includes("AURYN_BASE_URL")||!portfolio.includes("CRON_SECRET")||portfolio.includes("AURYN_PRODUCTION_URL")||portfolio.includes("TRADING_LAB_CRON_SECRET"))throw new Error("confirmed working Portfolio Learning workflow regressed");
console.log("AURYN V9.9.9.38 Trading Lab canonical provenance + compact UX verification passed.");
