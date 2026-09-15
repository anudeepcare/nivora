import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),r=fs.readFileSync("app/api/quote/[symbol]/route.ts","utf8");
for(const x of ["fromFinnhub","finnhub.io/api/v1/quote","extended-hours observation outside freshness window"])if(!f.includes(x))throw new Error(`Missing V22 price contract ${x}`);
if(!r.includes("FINNHUB_API_KEY"))throw new Error("Finnhub key not wired to quote authority");
for(const x of ["fromTwelveIntradayLast","interval=1min","prepost=true","marketPriceMaxAgeSeconds"])if(!f.includes(x))throw new Error(`Prior pricing regression ${x}`);
console.log("AURYN V9.9.9.22 multi-provider current-price verification passed.");
