#!/usr/bin/env node
// NIVORA V64.2 decision-distribution audit.
//
// Input is a JSON array of pre-Today real-market decision inputs captured immediately
// before deriveTodayAction(). This intentionally audits the decision policy without
// altering scores or manufacturing BUYs.
//
// Usage:
//   npm run audit:decisions -- --input decision-inputs.json --output decision-audit.json
//
// Report:
// - BUY / WAIT / AVOID / NO ACTION distribution
// - calibrated BUY pathway distribution
// - dominant blockers
// - closest-to-BUY rows

import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {auditDecisionDistribution}=require("../.engine-test/nivora-buy-calibration.js");

const args={};
const argv=process.argv.slice(2);
for(let i=0;i<argv.length;i++)if(argv[i].startsWith("--"))args[argv[i].slice(2)]=argv[i+1];

const input=args.input||"decision-inputs.json";
if(!fs.existsSync(input)){
 console.error(`Missing ${input}. Export real pre-Today decision inputs first.`);
 process.exit(1);
}
const rows=JSON.parse(fs.readFileSync(input,"utf8"));
if(!Array.isArray(rows)){console.error("Input must be a JSON array.");process.exit(1)}

const audit=auditDecisionDistribution(rows);
const closest=audit.details
 .filter(x=>!x.calibration.eligible&&x.calibration.closestPath)
 .sort((a,b)=>(a.calibration.paths[0]?.distance??999)-(b.calibration.paths[0]?.distance??999))
 .slice(0,25)
 .map(x=>({
   symbol:x.symbol,
   action:x.action,
   closestPath:x.calibration.closestPath,
   distance:x.calibration.paths[0]?.distance??null,
   primaryBlocker:x.calibration.primaryBlocker,
   blockers:x.calibration.blockers.slice(0,4)
 }));

const report={
 schemaVersion:"v64.2-decision-audit-1",
 generatedAt:new Date().toISOString(),
 total:audit.total,
 actions:audit.actions,
 paths:audit.paths,
 dominantBlockers:audit.dominantBlockers.slice(0,20),
 closestToBuy:closest,
 note:"Distribution is diagnostic evidence. It does not define a desired BUY percentage and does not tune thresholds automatically."
};
const output=args.output||"decision-audit.json";
fs.writeFileSync(output,JSON.stringify(report,null,2));

console.log(`Scanned ${report.total} real decision inputs.`);
console.log("Actions:",report.actions);
console.log("BUY paths:",report.paths);
console.log("Dominant blockers:");
for(const x of report.dominantBlockers.slice(0,10))console.log(`  ${x.count} × ${x.reason}`);
console.log("Closest to BUY:");
for(const x of report.closestToBuy.slice(0,10))console.log(`  ${x.symbol||"?"}: ${x.closestPath} · distance ${x.distance} · ${x.primaryBlocker}`);
