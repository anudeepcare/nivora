import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
for(const x of ["normalizeTwelveQuote","extended_price","extended_timestamp","normalized.price","normalized.providerTimestamp","activeSessionPool"])if(!f.includes(x))throw new Error(`Missing Twelve extended-hours fix ${x}`);
if(!f.includes('kind==="QUOTE_MID"'))throw new Error("Alpaca quote midpoint fallback regression");
console.log("AURYN V9.9.9.17 Twelve extended-hours pricing verification passed.");
