import fs from "node:fs";
const e=fs.readFileSync("lib/auryn/v99925/long-term-roadmap.ts","utf8"),n=fs.readFileSync("lib/auryn/v99925/investment-narrative.ts","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
for(const x of ["aggregateWeekly","wma50","wma200","fib382","fib50","fib618","fib786","extension1272","extension1618","waveCandidate","invalidation","nextTrigger"])if(!e.includes(x))throw new Error(`Roadmap engine missing ${x}`);
for(const x of ["whyOwn","whatWorth","whereAccumulate","whatConfirms","whatBreaks","whatChanged","nextDecision"])if(!n.includes(x))throw new Error(`Narrative missing ${x}`);
for(const x of ["LONG-TERM STRUCTURE","Investment roadmap","WHY OWN IT","WHAT IT'S WORTH","WHERE TO ACCUMULATE","WHAT CONFIRMS","WHAT BREAKS","NEXT DECISION","Wave candidate"])if(!v.includes(x))throw new Error(`Overview missing ${x}`);
if(!s.includes("longTermBars")||!s.includes("range=5Y"))throw new Error("Independent 5Y history not wired");
if(!c.includes(".v99925Roadmap")||!c.includes("@media(max-width:700px)"))throw new Error("Responsive V25 UX missing");
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED"])if(!s.includes(x))throw new Error(`V24.2 price regression ${x}`);
console.log("AURYN V9.9.9.25 Investment Roadmap verification passed.");
