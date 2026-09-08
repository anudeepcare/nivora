import fs from 'node:fs';
import path from 'node:path';

const arg=process.argv.find(x=>x.startsWith('--observations='));
const observationsPath=arg?.split('=').slice(1).join('=')||process.env.AURYN_V9_OBSERVATIONS||'';
const {generateFeatureCatalog,featureCatalogSummary}=await import('../.engine-test/auryn/v9/feature-registry.js');
const {runFeatureTournament}=await import('../.engine-test/auryn/v9/tournament.js');
const {AURYN_V9_RESEARCH_VERSION}=await import('../.engine-test/auryn/v9/version.js');
const summary=featureCatalogSummary();
if(!observationsPath){
 console.log(JSON.stringify({version:AURYN_V9_RESEARCH_VERSION,state:'CATALOG_ONLY',catalog:summary,note:'Set AURYN_V9_OBSERVATIONS=/path/to/point-in-time-observations.json or --observations=... to run the tournament. No production weights are changed.'},null,2));
 process.exit(0);
}
const full=path.resolve(observationsPath);
const text=fs.readFileSync(full,'utf8').trim();
const parsed=!text?[]:text.startsWith('[')?JSON.parse(text):text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
if(!Array.isArray(parsed))throw new Error('Observation file must contain a JSON array or JSONL rows.');
const ids=[...new Set(parsed.map(x=>String(x.featureId||'')).filter(Boolean))];
const catalogIds=new Set(generateFeatureCatalog().map(x=>x.id));
const unknown=ids.filter(id=>!catalogIds.has(id));
const tournament=runFeatureTournament(parsed,{featureIds:ids});
console.log(JSON.stringify({version:AURYN_V9_RESEARCH_VERSION,state:'TOURNAMENT_COMPLETE',observations:parsed.length,featuresSubmitted:ids.length,unknownCatalogFeatures:unknown,tournament,note:'PRODUCTION_CANDIDATE is not PROMOTED. Explicit approval/versioning is still required.'},null,2));
