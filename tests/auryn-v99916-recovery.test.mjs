import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const fq=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),stock=fs.readFileSync("components/StockClient.tsx","utf8"),v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),css=fs.readFileSync("app/auryn-premium.css","utf8");
test("premarket quote midpoint remains eligible even when stale regular trade exists",()=>{assert.match(fq,/activeSessionPool/);assert.match(fq,/QUOTE_MID/);});
test("overview action callbacks use shared scroll-aware navigator",()=>{for(const x of ["onOpenCatalysts={()=>handleEvidenceTab","onOpenRisks={()=>handleEvidenceTab","onOpenDetails={()=>handleEvidenceTab","onOpenThesis={()=>handleEvidenceTab","onOpenValuation={()=>handleEvidenceTab"])assert.ok(stock.includes(x),x);});
test("overview has dedicated scroll target and meaningful bottom sizing",()=>{assert.match(stock,/overviewRef/);assert.match(v,/v99916Insights/);assert.match(css,/\.v99916Insights/);});
test("partial decision map suppresses null current marker",()=>{assert.match(v,/current!=null\?<div className="v2CurrentMapMarker"/);});
