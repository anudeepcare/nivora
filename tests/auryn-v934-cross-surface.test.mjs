import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import vm from 'node:vm';import ts from 'typescript';
const mod=await import('../.engine-test/auryn/v934/projections.js').catch(()=>({}));
const {projectMarketIntelligence}=mod;
const sample={version:'auryn-market-intelligence-v934',snapshotId:'IREN-mi-1',fingerprint:'abc',symbol:'IREN',asOf:'2026-09-10T18:00:00.000Z',marketTruthSnapshotId:'IREN-market-1',session:'REGULAR',calendarState:'OPEN',displayPrice:45.2,decisionPrice:45.2,priceState:'LIVE_VERIFIED',priceUse:'LIVE_EXECUTION',confirmed:{'4H':{rating:'BUY',score:44},'1D':{rating:'NEUTRAL',score:8},'1W':{rating:'BUY',score:36}},livePreview:{'1D':{rating:'SELL',score:-24}},actionMap:{preferredEntry:{low:42.8,high:44.2,confidence:'HIGH',evidence:[]},confirm:47.65,support:42.8,majorSupport:40.1,invalidation:38.9,t1:51.2,t2:57.4,asOf:'2026-09-09',zones:[],supportZone:null,resistanceZone:null},summary:{primaryTimeframe:'1D',confirmedRating:'NEUTRAL',liveRating:'SELL',alignment:'BULLISH_BIAS',researchActive:true},coverage:{requested:['15M','1H','4H','1D','1W'],confirmed:['4H','1D','1W'],preview:['1D'],missing:['15M','1H']}};

test('market intelligence projection keeps one snapshot identity and actionable levels',()=>{const p=projectMarketIntelligence(sample);assert.equal(p.snapshotId,'IREN-mi-1');assert.equal(p.marketTruthSnapshotId,'IREN-market-1');assert.equal(p.timeframes['1D'].confirmed,'NEUTRAL');assert.equal(p.timeframes['1D'].livePreview,'SELL');assert.equal(p.levels.confirm,47.65);assert.equal(p.levels.invalidation,38.9);});

import {persistAutonomousResearch,AUTONOMOUS_RESEARCH_ENGINE_VERSION} from '../.engine-test/auryn/v995/persist-research.js';
test('server snapshot retains raw market intelligence for faithful projection',async()=>{
 let saved;const db={from:()=>({insert:async row=>{saved=row;return {error:null};}})};
 await persistAutonomousResearch(db,'IREN',{state:'RESEARCH_READY',decision:{policyVersion:AUTONOMOUS_RESEARCH_ENGINE_VERSION,snapshotId:'d1',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'SELECTIVE',decisionScore:60,evidenceCompleteness:80,setupState:'REPAIRING'},marketTruth:{snapshotId:sample.marketTruthSnapshotId,decisionPrice:45.2},marketIntelligence:sample});
 const p=projectMarketIntelligence(saved.evidence.v934);assert.equal(p.levels.confirm,47.65);assert.equal(p.marketTruthSnapshotId,sample.marketTruthSnapshotId);
});

test('decision summaries preserve the shared canonical projection and withhold missing analysis',async()=>{
 const projected=projectMarketIntelligence(sample),research={...projected,state:'READY',decisionSnapshotId:'trusted-server',action:'WAIT',ownerAction:'HOLD',decisionScore:null,evidenceCompleteness:0,decision:{longTermAction:'UNASSESSED',setupState:'UNASSESSED',executionAction:'BLOCKED'}};
 const imports={'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},'@/lib/auryn/v935/canonical':{loadAurynCanonicalSnapshots:async symbols=>{assert.deepEqual(Array.from(symbols),['IREN','MISSING']);return new Map([['IREN',{research,market:{displayPrice:45.2,executionTradable:true}}]])}},'@/lib/rate-limit':{rateLimitDistributed:async()=>({ok:true}),requestKey:()=> 'fixture'}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/decision/summaries/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{if(!(name in imports))throw Error(name);return imports[name]},URL,Date,Response});
 const response=await exports.GET(new Request('https://example.invalid/api/decision/summaries?symbols=iren,MISSING,iren'));
 assert.equal(response.status,200);const {items}=await response.json();
 assert.equal(items[0].decisionSnapshotId,'trusted-server');assert.equal(items[0].levels.confirm,47.65);assert.equal(items[0].levels.invalidation,38.9);assert.equal(items[0].canonicalAction,'WAIT');assert.equal(items[0].decisionScore,null);assert.equal(items[0].executionTradable,false);
 assert.equal(items[1].canonicalAction,null);assert.equal(items[1].decisionRole,'ANALYSIS_REQUIRED');assert.equal(items[1].levels,null);assert.equal(items[1].executionTradable,false);
});

test('trading lab requires canonical V9.3.4 intelligence and uses its invalidation when available',()=>{const src=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');assert.match(src,/v934/);assert.match(src,/MARKET_INTELLIGENCE_MISSING/);assert.match(src,/actionMap.*invalidation|levels.*invalidation/s);});
