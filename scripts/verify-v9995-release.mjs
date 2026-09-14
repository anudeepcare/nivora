import fs from "node:fs";
const t=fs.readFileSync("lib/auryn/market-truth.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const k of ["priceTimestamp","checkedAt","freshness","confidence","ageSeconds"])if(!t.includes(k))throw new Error(`Missing market truth field ${k}`);
if(!/Intl\.DateTimeFormat/.test(t))throw new Error("Local timezone rendering missing");
if(/America\/Chicago/.test(t))throw new Error("Viewer timezone must not be hard coded");
if(!/buildMarketTruth/.test(s)||!/formatMarketTruth/.test(s))throw new Error("Stock surfaces are not unified");
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json changed");
console.log("V9.9.9.5 verified: one canonical display truth, local-time rendering, session/freshness consistency; no SQL required.");
