import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),c=fs.readFileSync("app/api/chart/[symbol]/route.ts","utf8");
if(!/quote\?symbol=.*prepost=true/.test(f))throw new Error("Twelve quote prepost=true missing");
if(!c.includes("prepost=true"))throw new Error("Intraday chart prepost=true missing");
for(const x of ["normalizeTwelveQuote","extended_price","extended_timestamp","activeSessionPool"])if(!f.includes(x))throw new Error(`Extended pricing regression ${x}`);
console.log("AURYN V9.9.9.18 permanent Twelve pre/post contract verification passed.");
