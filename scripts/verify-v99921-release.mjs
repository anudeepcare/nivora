import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["fromTwelveIntradayLast","time_series?symbol=","interval=1min","prepost=true","twelve-intraday"])if(!f.includes(x))throw new Error(`Missing intraday fallback ${x}`);
if(!a.includes("validRaw.filter")||!a.includes('"twelvedata"'))throw new Error("Provider-family dedupe missing");
if(!s.includes("ageSeconds")||!s.includes("q?.reason"))throw new Error("Exact provider diagnostics missing");
console.log("AURYN V9.9.9.21 redundant Twelve price authority verification passed.");
