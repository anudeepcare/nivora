import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
if(!f.includes("activeSessionPool")||!f.includes('kind==="QUOTE_MID"'))throw new Error("Premarket quote recovery missing");
for(const x of ["handleEvidenceTab","data-auryn-section","overviewRef"])if(!s.includes(x))throw new Error(`Navigation recovery missing ${x}`);
if(!v.includes("v99916Insights")||!v.includes('current!=null?<div className="v2CurrentMapMarker"'))throw new Error("Overview recovery incomplete");
console.log("AURYN V9.9.9.16 premarket/navigation/readability recovery passed.");
