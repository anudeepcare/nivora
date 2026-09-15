import fs from "node:fs";
const req=["lib/auryn/v99910/fundamental-analyst.ts","components/StockClient.tsx","components/premium/AurynResearchOverview.tsx","tests/auryn-v99910-fundamental-analyst.test.mjs",".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"];
for(const f of req)if(!fs.existsSync(f))throw new Error(`Missing: ${f}`);
const e=fs.readFileSync(req[0],"utf8"),stock=fs.readFileSync(req[1],"utf8"),u=fs.readFileSync(req[2],"utf8"),w=req.slice(4).map(f=>fs.readFileSync(f,"utf8")).join("\n");
if(!stock.trimStart().startsWith('"use client";'))throw new Error("StockClient client directive must remain first");
if(/breakout|support|resistance|RSI|momentum/i.test(e))throw new Error("Fundamental valuation contaminated by technical levels");
for(const x of ["fundamentalScenario.assumptions","companyDimensions","Fair value"])if(!u.includes(x))throw new Error(`Missing UI contract ${x}`);
for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!w.includes(x))throw new Error(`Missing workflow contract ${x}`);
console.log("AURYN V9.9.9.10 fundamental analyst release verification passed.");
