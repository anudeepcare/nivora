import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["activeHelp","v99927HelpPopover","buildConfluenceZones","STRONG SUPPORT","KEY RECLAIM","CURRENT POSITION","UPSIDE ROADMAP","Fib retracement","volume participation"])if(!v.includes(x))throw new Error(`V27 missing ${x}`);
for(const x of [".v99927CoreGrid",".v99927ConfluenceMap",".v99927CurrentPosition"])if(!c.includes(x))throw new Error(`V27 CSS missing ${x}`);
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`Regression ${x}`);
console.log("AURYN V9.9.9.27 confluence UX verification passed.");
