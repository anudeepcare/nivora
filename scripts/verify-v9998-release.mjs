import fs from "node:fs";
const required=[
 "components/premium/AurynResearchOverview.tsx",
 "tests/auryn-v9998-analyst-layer.test.mjs",
 ".github/workflows/auryn-v996-validation-queue.yml",
 ".github/workflows/nivora-calibration-mature.yml"
];
for(const f of required)if(!fs.existsSync(f))throw new Error(`Missing release file: ${f}`);
const ui=fs.readFileSync(required[0],"utf8");
for(const token of ["v9998AnalystClocks","Independent fundamental valuation unavailable","decisionLabelLane","AURYN VIEW"])if(!ui.includes(token))throw new Error(`Missing analyst-layer contract: ${token}`);
const workflows=required.slice(2).map(f=>fs.readFileSync(f,"utf8")).join("\n");
if(!workflows.includes("AURYN_BASE_URL")||!workflows.includes("CRON_SECRET"))throw new Error("Canonical autonomous workflow secrets are missing");
console.log("AURYN V9.9.9.8 release verification passed.");
