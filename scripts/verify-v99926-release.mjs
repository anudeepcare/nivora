import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),e=fs.readFileSync("lib/auryn/v99925/long-term-roadmap.ts","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["clusterMapNodes","ENTRY / CURRENT","v99926Help","Weekly HMA","Volume vs avg","Accumulation","Trend channel","Confluence"])if(!v.includes(x))throw new Error(`V26 UI missing ${x}`);
for(const x of ["hma","volumeRatio","accumulationScore","trendChannel","confluenceScore"])if(!e.includes(x))throw new Error(`V26 evidence missing ${x}`);
if(!c.includes(".v99926PillarGrid")||!c.includes("white-space:nowrap"))throw new Error("V26 readability CSS missing");
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`Regression ${x}`);
console.log("AURYN V9.9.9.26 readability/evidence verification passed.");
