import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const read=n=>{try{return fs.readFileSync(new URL(`../scripts/${n}`,import.meta.url),'utf8')}catch{return ''}};

test('V9.2 exposes normalize, network backfill, data audit, core test and master gate commands',()=>{
 assert.match(pkg.scripts['normalize:v92']||'',/run_v92_normalize/);
 assert.match(pkg.scripts['backfill:v92']||'',/run_v92_backfill/);
 assert.match(pkg.scripts['audit:v92-data']||'',/run_v92_data_audit/);
 assert.match(pkg.scripts['test:v92-core']||'',/auryn-v92/);
 assert.match(pkg.scripts['gate:v92']||'',/run_v92_release_gate/);
});

test('V9.2 backfill requires explicit dates and research credentials and never embeds secrets',()=>{
 const s=read('run_v92_backfill.mjs');
 assert.match(s,/TWELVE_DATA_API_KEY/);assert.match(s,/SEC_USER_AGENT/);assert.match(s,/start-date/);assert.match(s,/end-date/);
 assert.doesNotMatch(s,/apikey\s*=\s*["'][A-Za-z0-9]{12,}/i);
});

test('V9.2 ingestion scripts remain isolated from production decision and broker mutation paths',()=>{
 for(const name of ['run_v92_normalize.mjs','run_v92_backfill.mjs','run_v92_data_audit.mjs']){
  const s=read(name); assert.doesNotMatch(s,/(?:production-registry|v5\/cio|nivora-broker|run-paper)/i,`${name} must be research only`);
 }
});

test('V9.2 real-data gate can require canonical research families and corporate-action verification',()=>{
 const audit=read('run_v92_data_audit.mjs'),gate=read('run_v92_release_gate.mjs');
 assert.match(audit,/required-families/i);
 assert.match(audit,/corporateActionCorruptionCount/);
 assert.match(gate,/FUNDAMENTALS/);
 assert.match(gate,/EARNINGS/);
 assert.match(gate,/REVISION/);
 assert.match(gate,/SECTOR/);
 assert.match(gate,/MACRO/);
 assert.match(gate,/CORPORATE_ACTIONS/);
});


test('V9.2 backfill wires opt-in corporate actions, earnings, explicit research events and FRED vintages',()=>{
 const s=read('run_v92_backfill.mjs');
 assert.match(s,/with-corporate-actions/);
 assert.match(s,/with-earnings/);
 assert.match(s,/research-events/);
 assert.match(s,/fred-series/);
 assert.match(s,/FRED_API_KEY/);
 assert.match(s,/normalizeTwelveDataSplits/);
 assert.match(s,/normalizeTwelveDataDividends/);
 assert.match(s,/normalizeTwelveDataEarnings/);
 assert.match(s,/normalizePointInTimeResearchRows/);
 assert.match(s,/normalizeFredVintageObservations/);
});
