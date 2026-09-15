import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),nav=fs.readFileSync("components/stock/StockEvidenceNav.tsx","utf8");
if(!s.includes('tab==="thesis"&&institutionalDecision?<AurynResearchOverviewV2'))throw new Error("Overview is not tab-scoped");
if(s.includes("<StockThesisPanel")||s.includes('tab==="news"'))throw new Error("duplicate/dead tab UI remains");
for(const x of ["WHY OWN IT","WHAT MUST GO RIGHT","WHAT BREAKS THE BUSINESS THESIS","5-YEAR BUSINESS RECORD"])if(!s.includes(x))throw new Error(`Business thesis detail missing ${x}`);
if(!s.includes('if(tab!=="institutions"||d?.assetType==="crypto")return;'))throw new Error("institutional evidence is not lazy");
for(const p of ["components/stock/StockThesisPanel.tsx","components/stock/StockActionPlan.tsx","components/stock/StockDecisionSummary.tsx","components/stock/v5/StockV5Decision.tsx","components/stock/v931/AstraAnalystPanel.tsx","components/stock/v931/InstitutionalDecisionBrief.tsx"])if(fs.existsSync(p))throw new Error(`dead component remains ${p}`);
for(const label of ["Overview","Business","Earnings","Technicals","Ownership","Catalysts","Options"])if(!nav.includes(label))throw new Error(`nav missing ${label}`);
console.log("AURYN V9.9.9.34 tab deduplication and performance cleanup verification passed.");
