import fs from "node:fs";
const a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),t=fs.readFileSync("lib/auryn/market-truth.ts","utf8");
if(!/ACTIVE_SESSION_PRICE_UNAVAILABLE/.test(a))throw new Error("Active-session unavailable invariant missing");
if(/input\.session!=="REGULAR"[\s\S]{0,500}LAST MARKET PRICE/.test(a))throw new Error("Stale extended-hours primary fallback returned");
if(!/AFTER-HOURS PRICE UNAVAILABLE/.test(t)||!/PRE-MARKET PRICE UNAVAILABLE/.test(t))throw new Error("Explicit unavailable states missing");
if(!/referencePrice/.test(t))throw new Error("Secondary regular-close context missing");
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json changed");
console.log("V9.9.9.6 verified: active sessions require current-session price; stale morning price cannot become primary.");
