import fs from "node:fs";
const f=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),m=fs.readFileSync("lib/nivora-market-session.ts","utf8");
if(!m.includes('export type QuoteFreshness="LIVE"|"STALE"|"LAST_TRADE"'))throw new Error("Unexpected QuoteFreshness contract");
if(f.includes('freshness:"RECENT"'))throw new Error("Invalid QuoteFreshness RECENT remains");
if(!f.includes('freshness:"LAST_TRADE"')||!f.includes('displayState:"LAST_AVAILABLE"'))throw new Error("LAST_AVAILABLE freshness contract incomplete");
console.log("AURYN V9.9.9.24.2 QuoteFreshness compile hotfix passed.");
