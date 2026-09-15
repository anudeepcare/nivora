import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
for(const x of ["v99914Hero","v99914Indicator","v99914ContextBadge","Valuation Model: Partial","combinedThesisSupport","THESIS / SUPPORT","View Valuation Evidence","Last Updated"])if(!v.includes(x))throw new Error(`Missing exact mock contract ${x}`);
if(!v.includes('valuationState==="PARTIAL"'))throw new Error("PARTIAL valuation suppression missing");
for(const x of [".v99914Hero",".v99914Indicator",".v99914ContextBadge",".v99914BottomGrid"])if(!c.includes(x))throw new Error(`Missing exact mock CSS ${x}`);
console.log("AURYN V9.9.9.14 exact approved mock verification passed.");
