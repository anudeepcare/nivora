import fs from "node:fs";
const stock=fs.readFileSync("components/StockClient.tsx","utf8"),v2=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
const call=stock.match(/<AurynResearchOverviewV2[\s\S]*?\/>/)?.[0]||"";
if(!call)throw new Error("Overview V2 render missing");
if(/\bscenario=/.test(call))throw new Error("Obsolete scenario prop passed to Overview V2");
if(!/fundamentalScenario=/.test(call)||!/analystFundamentals=/.test(call))throw new Error("V2 analyst props missing");
for(const f of [".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"])if(!fs.existsSync(f))throw new Error(`Missing ${f}`);
console.log("AURYN V9.9.9.11.1 Overview V2 compile-contract verification passed.");
