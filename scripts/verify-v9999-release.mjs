import fs from "node:fs";
const required=["components/premium/AurynResearchOverview.tsx","tests/auryn-v9999-final-analyst-ux.test.mjs",".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"];
for(const f of required)if(!fs.existsSync(f))throw new Error(`Missing release file: ${f}`);
const ui=fs.readFileSync(required[0],"utf8");
for(const x of ["BUSINESS QUALITY","VALUATION","MARKET TIMING","v9999DecisionVisuals","Independent fundamental valuation unavailable","KEY CATALYSTS","KEY RISKS","WHAT'S CHANGED","AURYN VIEW"])if(!ui.includes(x))throw new Error(`Missing final analyst UX contract: ${x}`);
const wf=required.slice(2).map(f=>fs.readFileSync(f,"utf8")).join("\n");
for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!wf.includes(x))throw new Error(`Missing workflow contract: ${x}`);
console.log("AURYN V9.9.9.9 final analyst UX verification passed.");
