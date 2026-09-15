import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
for(const x of ['displayState:"LAST_AVAILABLE"',"lastAvailable"])if(!f.includes(x))throw new Error(`Missing last-available price contract ${x}`);
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","PRICE UNAVAILABLE","visibilitychange",'addEventListener("online"','addEventListener("focus"',"formatPriceObservedAt"])if(!s.includes(x))throw new Error(`Missing price-state contract ${x}`);
if(s.includes("Provider status:"))throw new Error("Provider diagnostics leaked into normal UX");
if(/status=.*PRICE VERIFYING/.test(s))throw new Error("PRICE VERIFYING remains a normal masthead state");
if(!v.includes('displayPriceLive?"Current":"Reference"'))throw new Error("Reference/live Overview distinction regressed");
console.log("AURYN V9.9.9.24 always-on price state verification passed.");
