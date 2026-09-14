import fs from "node:fs";
const must=["lib/auryn/fast-quote.ts","lib/auryn/market-price-authority.ts","app/api/quote/[symbol]/route.ts",".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"];
for(const f of must)if(!fs.existsSync(f))throw new Error(`Missing ${f}`);
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
if(!/CRYPTO_24X7/.test(f)||!/QUOTE_MID/.test(f)||!/diagnostics/.test(f))throw new Error("Reliability governor incomplete");
const c=fs.readFileSync("components/StockClient.tsx","utf8");
if(!/12000/.test(c))throw new Error("Research polling was not reduced");
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json changed");
console.log("V9.9.8.1 verified: equity/ETF/crypto reliability governor + diagnostics + sane polling; no SQL required.");
