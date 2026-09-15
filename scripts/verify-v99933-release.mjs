import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["v99933FirstScreen","v99933CallState","callStateTone","v99933AnalystGrid","v99933Insight","weeklyStructureLabel","Negative FCF","Conventional FCF valuation is not reliable"])if(!v.includes(x))throw new Error(`V33 UX missing ${x}`);
if(v.includes('className="v99929Cio"')||v.includes("AURYN CIO"))throw new Error("duplicate CIO returned");
for(const x of [".v99933CallState.buy",".v99933CallState.wait",".v99933CallState.hold",".v99933CallState.avoid",".v99933AnalystCard.positive",".v99933AnalystCard.caution",".v99933AnalystCard.negative"])if(!c.includes(x))throw new Error(`semantic CSS missing ${x}`);
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`price/canonical regression ${x}`);
console.log("AURYN V9.9.9.33 premium research UX verification passed.");
