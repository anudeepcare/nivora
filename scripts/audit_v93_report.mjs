import fs from 'node:fs';
import path from 'node:path';

const valueArg=(name)=>{const p=`--${name}=`;const a=process.argv.find(x=>x.startsWith(p));return a?a.slice(p.length):'';};
const reportPath=valueArg('report');
const runManifestPath=valueArg('run-manifest');
const secondRunManifestPath=valueArg('second-run-manifest');
if(!reportPath||!runManifestPath)throw new Error('Usage: npm run audit:v93-report -- --report=/path/auryn-v93-tournament-report.json --run-manifest=/path/auryn-v93-run-manifest.json [--second-run-manifest=/path/run-2/auryn-v93-run-manifest.json]');
const report=JSON.parse(fs.readFileSync(path.resolve(reportPath),'utf8'));
const runManifest=JSON.parse(fs.readFileSync(path.resolve(runManifestPath),'utf8'));
const second=secondRunManifestPath?JSON.parse(fs.readFileSync(path.resolve(secondRunManifestPath),'utf8')):null;
const errors=[];
const expected=46464;
if(report.catalog?.canonicalCount!==expected)errors.push(`canonicalCount must be ${expected}.`);
if(report.catalog?.selectedCount!==expected)errors.push(`selectedCount must be ${expected}.`);
if(report.catalog?.completeCatalog!==true)errors.push('completeCatalog must be true.');
if(report.tournament?.dispositionCount!==expected)errors.push(`dispositionCount must be ${expected}.`);
if(report.tournament?.fdrScopeCount!==expected)errors.push(`fdrScopeCount must be ${expected}.`);
if(!Array.isArray(report.tournament?.results)||report.tournament.results.length!==expected)errors.push(`results must contain exactly ${expected} rows.`);
const ids=Array.isArray(report.tournament?.results)?report.tournament.results.map(x=>x.featureId):[];
if(new Set(ids).size!==ids.length)errors.push('Tournament results contain duplicate feature IDs.');
if((report.tournament?.duplicateMetricFeatureIds??[]).length)errors.push('Duplicate metric feature IDs were detected.');
if((report.tournament?.unknownMetricFeatureIds??[]).length)errors.push('Unknown metric feature IDs were detected.');
if(report.upstream?.quality!=='DECISION_GRADE')errors.push('Upstream V9.1 quality must be DECISION_GRADE.');
if(report.upstream?.survivorshipSafe!==true)errors.push('Upstream data must be survivorshipSafe.');
if(report.upstream?.adjustedPricesVerified!==true)errors.push('Upstream adjustedPricesVerified must be true.');
if(report.safety?.researchOnly!==true||report.safety?.productionRegistryMutated!==false||report.safety?.cioMutated!==false||report.safety?.marketTruthMutated!==false||report.safety?.brokerPermissionsMutated!==false)errors.push('V9.3 research-only safety boundary was violated.');
for(const row of report.tournament?.results??[]){
  if(row.disposition==='V94_CANDIDATE'){
    if(row.promotion?.eligible!==true)errors.push(`V94_CANDIDATE ${row.featureId} is not promotion.eligible.`);
    const checks=row.promotion?.checks??{};
    if(Object.values(checks).some(v=>v!==true))errors.push(`V94_CANDIDATE ${row.featureId} has a failed promotion check.`);
  }
}
if(runManifest.completeCatalog!==true||runManifest.canonicalCount!==expected||runManifest.selectedCount!==expected)errors.push('Run manifest is not a full-catalog run.');
if(runManifest.researchOnly!==true||runManifest.autoProductionPromotion!==false)errors.push('Run manifest violates research-only/no-auto-production policy.');
if(runManifest.deterministicFingerprint!==report.deterministicFingerprint)errors.push('Run manifest/report deterministicFingerprint mismatch.');
if(second&&second.deterministicFingerprint!==runManifest.deterministicFingerprint)errors.push('Twin full-catalog runs produced different deterministicFingerprint values.');
const state=errors.length?'BLOCKED':'PASS';
console.log(JSON.stringify({version:report.version,state,canonicalCount:report.catalog?.canonicalCount??null,dispositionCount:report.tournament?.dispositionCount??null,v94Candidates:report.tournament?.v94CandidateCount??null,deterministicFingerprint:report.deterministicFingerprint??null,twinRunVerified:Boolean(second)&&!errors.some(x=>x.includes('Twin full-catalog')),errors},null,2));
if(errors.length)process.exitCode=1;
