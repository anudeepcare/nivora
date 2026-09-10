import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const valueArg=(name)=>{const p=`--${name}=`;const a=process.argv.find(x=>x.startsWith(p));return a?a.slice(p.length):'';};
const readJsonOrJsonl=(file)=>{const text=fs.readFileSync(file,'utf8').trim();if(!text)return[];if(text.startsWith('['))return JSON.parse(text);return text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));};
const sha=(text)=>crypto.createHash('sha256').update(text).digest('hex');

const basePath=valueArg('base')||process.env.AURYN_V93_BASE_OBSERVATIONS||'';
const manifestPath=valueArg('manifest')||process.env.AURYN_V93_OBSERVATION_MANIFEST||'';
const outputDir=valueArg('output-dir')||process.env.AURYN_V93_OUTPUT_DIR||'';
if(!basePath||!manifestPath||!outputDir)throw new Error('Usage: npm run research:v93 -- --base=/path/base-observations.jsonl --manifest=/path/base-observations.jsonl.manifest.json --output-dir=/path/v93-output [--candidate-start=0] [--candidate-limit=46464] [--shard-size=256]');

const baseFull=path.resolve(basePath),manifestFull=path.resolve(manifestPath),outDir=path.resolve(outputDir);
const baseText=fs.readFileSync(baseFull,'utf8'),manifestText=fs.readFileSync(manifestFull,'utf8');
const base=readJsonOrJsonl(baseFull),manifest=JSON.parse(manifestText);
const {runV93TournamentFromBaseObservations}=await import('../.engine-test/auryn/v93/runner.js');
const start=Math.max(0,Number(valueArg('candidate-start')||0)||0);
const limitRaw=valueArg('candidate-limit');
const shardRaw=valueArg('shard-size');
const result=runV93TournamentFromBaseObservations(base,manifest,{candidateStart:start,candidateLimit:limitRaw?Number(limitRaw):undefined,shardSize:shardRaw?Number(shardRaw):undefined});
fs.mkdirSync(outDir,{recursive:true});

const reportPath=path.join(outDir,'auryn-v93-tournament-report.json');
const survivorPath=path.join(outDir,'auryn-v93-survivor-registry.json');
const rejectionPath=path.join(outDir,'auryn-v93-rejections.jsonl');
const runManifestPath=path.join(outDir,'auryn-v93-run-manifest.json');
const reportText=JSON.stringify(result.report,null,2)+'\n';
const survivorText=JSON.stringify(result.survivorRegistry,null,2)+'\n';
const rejectionText=result.rejections.map(x=>JSON.stringify(x)).join('\n')+(result.rejections.length?'\n':'');
fs.writeFileSync(reportPath,reportText);
fs.writeFileSync(survivorPath,survivorText);
fs.writeFileSync(rejectionPath,rejectionText);
const runManifest={
  version:result.report.version,
  datasetId:manifest.datasetId??null,
  baseObservationSha256:sha(baseText),
  observationManifestSha256:sha(manifestText),
  reportSha256:sha(reportText),
  survivorRegistrySha256:sha(survivorText),
  rejectionFileSha256:sha(rejectionText),
  deterministicFingerprint:result.report.deterministicFingerprint,
  policyVersion:result.report.policy.version,
  seed:result.report.policy.seed,
  canonicalCount:result.report.catalog.canonicalCount,
  selectedCount:result.report.catalog.selectedCount,
  completeCatalog:result.report.catalog.completeCatalog,
  researchOnly:true,
  autoProductionPromotion:false,
};
fs.writeFileSync(runManifestPath,JSON.stringify(runManifest,null,2)+'\n');
console.log(JSON.stringify({state:result.report.catalog.completeCatalog?'FULL_TOURNAMENT_COMPLETE':'DEVELOPMENT_PARTIAL',report:reportPath,survivors:survivorPath,rejections:rejectionPath,runManifest:runManifestPath,canonicalCount:result.report.catalog.canonicalCount,selectedCount:result.report.catalog.selectedCount,v94Candidates:result.report.tournament.v94CandidateCount,deterministicFingerprint:result.report.deterministicFingerprint,note:'V94_CANDIDATE is research-only. No production registry, CIO weight, Market Truth rule or broker permission is changed.'},null,2));
