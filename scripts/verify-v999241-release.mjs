import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8");
if(s.indexOf("const formatPriceObservedAt")<0||s.indexOf("const formatPriceObservedAt")>s.indexOf("if(!d||!view)"))throw new Error("Price timestamp formatter is still below progressive early return");
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","PRICE UNAVAILABLE","visibilitychange"])if(!s.includes(x))throw new Error(`V24 regression ${x}`);
console.log("AURYN V9.9.9.24.1 compile hotfix verification passed.");
