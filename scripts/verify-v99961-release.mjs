import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
if(!/label\?:DisplayLabel/.test(f))throw new Error("FastResearchQuote label type drift remains");
if(!/fallback==="PRE_MARKET"\|\|fallback==="AFTER_HOURS"/.test(f))throw new Error("Extended-hours calendar authority missing");
if(/if\(body\?\.is_market_open===false\)return "CLOSED"/.test(f))throw new Error("Provider can still collapse extended hours to CLOSED");
console.log("V9.9.9.6.1 verified: canonical DisplayLabel + AURYN extended-hours session authority.");
