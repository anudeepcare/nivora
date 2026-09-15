import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),p=fs.readFileSync("app/auryn-premium.css","utf8"),u=fs.readFileSync("app/auryn-unified-ui.css","utf8"),l=fs.readFileSync("app/layout.tsx","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8");
for(const x of ["helpAnchor","v99928HelpWrap","v99928HelpPopover","clusterMapNodes(mapNodes,.035)","ENTRY / CURRENT"])if(!v.includes(x))throw new Error(`V28 missing ${x}`);
if(!p.includes(".v99928HelpWrap{position:relative")||!p.includes(".v99928HelpPopover{position:absolute"))throw new Error("Anchored popover CSS missing");
for(const x of ["--auryn-ui-font","--auryn-display-font",".aurynStockPage",".aurynPortfolioPage",".aurynMonitorPage",".aurynTradingLabPage",".aurynOverviewV2"])if(!u.includes(x))throw new Error(`Unified UI missing ${x}`);
if(!l.includes('import "./auryn-unified-ui.css";'))throw new Error("Unified UI stylesheet not loaded");
for(const x of ["aurynPriceState","LAST_AVAILABLE","LAST_VERIFIED","longTermBars"])if(!s.includes(x))throw new Error(`Regression ${x}`);
console.log("AURYN V9.9.9.28 unified experience verification passed.");
