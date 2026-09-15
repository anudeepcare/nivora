import fs from "node:fs";
const e=fs.readFileSync("lib/auryn/v99910/fundamental-analyst.ts","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["GROWTH_EV_SALES_FCF","BANK_PB_ROE_NIM","REIT_FFO_AFFO","valuationState","decisionGrade","nonlinearScore"])if(!e.includes(x))throw new Error(`Missing valuation safety ${x}`);
if(/breakout|support|resistance|RSI|momentum/i.test(e))throw new Error("Technical contamination in fundamental engine");
for(const x of ["vs History","vs Peers","Growth adjusted","FCF yield","decisionLane","Bear case","Base case","Bull case"])if(!v.includes(x))throw new Error(`Missing V2 fidelity ${x}`);
if(!s.includes("businessModel:proofArchetype")||!s.includes("technicalEvidence="))throw new Error("V2 integration incomplete");
const wf=[".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"].map(f=>fs.readFileSync(f,"utf8")).join("\n");for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!wf.includes(x))throw new Error(`Missing ${x}`);
console.log("AURYN V9.9.9.12 intelligence + fidelity verification passed.");
