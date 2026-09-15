import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
for(const x of ["CANONICAL_REFERENCE","LAST VERIFIED PRICE","referencePriceActive"])if(!s.includes(x))throw new Error(`Missing reference fallback ${x}`);
if(!s.includes('stableLiveFresh=displayAuthority?.kind==="LAST_GOOD_LIVE"'))throw new Error("Reference can impersonate live");
if(!v.includes('displayPriceLive?"Current":"Reference"'))throw new Error("Reference label contract missing");
console.log("AURYN V9.9.9.23 research/reference price regression fix passed.");
