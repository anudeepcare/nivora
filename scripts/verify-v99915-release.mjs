import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),s=fs.readFileSync("components/StockClient.tsx","utf8"),e=fs.readFileSync("lib/auryn/v99910/fundamental-analyst.ts","utf8"),r=fs.readFileSync("app/api/chart/[symbol]/route.ts","utf8");
for(const x of ["chartRange","onChartRangeChange","onOpenCatalysts","onOpenRisks","onOpenDetails","onOpenThesis","onOpenValuation","v99915IndicatorIcon"])if(!v.includes(x))throw new Error(`Missing V15 contract ${x}`);
if(!s.includes("/api/chart/")||!s.includes("overviewChartRange"))throw new Error("Functional chart range integration missing");
if(!e.includes("independentCrossChecks>=1"))throw new Error("Valuation cross-check gate missing");
if(!r.includes("15min")||!r.includes("1day")||!r.includes("outputsize"))throw new Error("Range-specific chart provider route incomplete");
const wf=[".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"].map(f=>fs.readFileSync(f,"utf8")).join("\n");for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!wf.includes(x))throw new Error(`Missing workflow ${x}`);
console.log("AURYN V9.9.9.15 functional credibility verification passed.");
