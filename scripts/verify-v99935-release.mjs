import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
if(s.includes("v947DecisionFooter"))throw new Error("orphan bottom action footer remains");
for(const x of ["v99935DecisionActions","v99935Synthesis","v99935AurynView","Add to watchlist","Track position"])if(!v.includes(x))throw new Error(`overview UX missing ${x}`);
for(const x of ["v99935CatalystPage","v99935CatalystHero","v99935CatalystSection"])if(!s.includes(x))throw new Error(`catalyst UX missing ${x}`);
if(!c.includes("1480px")||!c.includes(".v99935CatalystHero{display:grid"))throw new Error("catalyst alignment CSS missing");
console.log("AURYN V9.9.9.35 overview action placement + catalyst UX verification passed.");
