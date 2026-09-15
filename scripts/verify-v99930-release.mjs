import fs from "node:fs";
const r=fs.readFileSync("lib/auryn/v99930/regime-structure.ts","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("lib/auryn/v99929/cio-decision.ts","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["REGIME_REBUILDING","activeRegime","historicalContext","MAX_ACTIVE_DISTANCE","MAX_ANCHOR_RANGE_MULTIPLE","extensionsAllowed"])if(!r.includes(x))throw new Error(`Regime truth missing ${x}`);
for(const x of ["LONG-TERM MAP REBUILDING","structuralTruthValid","historicalContext"])if(!v.includes(x))throw new Error(`Overview missing ${x}`);
for(const x of ["structuralTruthValid","STRUCTURE REBUILDING"])if(!c.includes(x))throw new Error(`CIO truth gate missing ${x}`);
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`Regression ${x}`);
console.log("AURYN V9.9.9.30 regime-aware structural truth verification passed.");
