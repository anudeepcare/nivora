import fs from "node:fs";
const e=fs.readFileSync("lib/auryn/v99929/cio-decision.ts","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["longTermAction","newMoneyAction","ownerAction","confidence","dataCompleteness","primaryBuyZone","deepValueZone","MAX_ZONE_WIDTH_PCT","whatChangesIt"])if(!e.includes(x))throw new Error(`CIO missing ${x}`);
for(const x of ["AURYN CIO","Why this decision","What changes it","v99929CioSheet","v99929ValueHelp","actionableWidth"])if(!v.includes(x))throw new Error(`UI missing ${x}`);
if(!c.includes(".v99929Cio")||!c.includes(".v99929CioBackdrop"))throw new Error("CIO CSS missing");
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`Regression ${x}`);
console.log("AURYN V9.9.9.29 CIO decision verification passed.");
