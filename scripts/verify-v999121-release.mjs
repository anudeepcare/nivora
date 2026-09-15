import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),call=s.match(/<AurynResearchOverviewV2[\s\S]*?\/>/)?.[0]||"";
if(!call)throw new Error("Overview V2 call missing");
if(/marketLab\?\.relativeStrengthPct/.test(call))throw new Error("Nonexistent marketLab relativeStrengthPct is still referenced");
if(!/technicalState\.trend/.test(call)||!/technicalState\.momentum/.test(call)||!/technicalState\.participation/.test(call))throw new Error("Canonical technical evidence missing");
console.log("AURYN V9.9.9.12.1 technical prop compile hotfix verification passed.");
