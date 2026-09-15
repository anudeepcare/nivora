import fs from "node:fs";
const a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
if(!a.includes("export const marketPriceMaxAgeSeconds"))throw new Error("Canonical freshness policy missing");
if(!f.includes("marketPriceMaxAgeSeconds"))throw new Error("Adapter not using canonical freshness");
if(/PRE_MARKET"\|\|session==="AFTER_HOURS"\?900/.test(f))throw new Error("Divergent adapter age remains");
for(const x of ["interval=1min&prepost=true","normalizeTwelveQuote","activeSessionPool"])if(!f.includes(x))throw new Error(`V19 regression ${x}`);
console.log("AURYN V9.9.9.20 unified market-price freshness verification passed.");
