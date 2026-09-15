import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8");
for(const x of ["v2ScoreRing","v2StateBadge","v2SpectrumTrack","v2ScenarioCurrentMarker","v2DecisionZones","v2RailConnector","v2AnalystRow","View Full Thesis"])if(!v.includes(x))throw new Error(`Missing mockup contract ${x}`);
for(const x of [".v2ScoreRing",".v2StateBadge",".v2SpectrumTrack",".v2DecisionZones",".v2AnalystRow"])if(!c.includes(x))throw new Error(`Missing mockup CSS ${x}`);
const wf=[".github/workflows/auryn-v996-validation-queue.yml",".github/workflows/nivora-calibration-mature.yml"].map(f=>fs.readFileSync(f,"utf8")).join("\n");for(const x of ["AURYN_BASE_URL","CRON_SECRET"])if(!wf.includes(x))throw new Error(`Missing workflow ${x}`);
console.log("AURYN V9.9.9.13 literal mockup fidelity verification passed.");
