import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
if(!/quote\?symbol=.*interval=1min.*prepost=true/.test(f))throw new Error("Twelve intraday prepost quote contract missing");
for(const x of ["normalizeTwelveQuote","extended_price","extended_timestamp","activeSessionPool"])if(!f.includes(x))throw new Error(`Pricing regression ${x}`);
if(!s.includes("quoteDiagnostic")||!s.includes("Provider status:"))throw new Error("Provider diagnostics not surfaced");
console.log("AURYN V9.9.9.19 intraday premarket price authority verification passed.");
