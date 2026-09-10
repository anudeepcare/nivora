import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {buildDecisionSnapshot}=require('../.engine-test/auryn/v931/decision-snapshot.js');
const {auditCrossSurfaceDecision,auditDecisionTransition,auditDeterministicFingerprints}=require('../.engine-test/auryn/v931/reliability.js');
const {buildCanonicalMarketSnapshot}=require('../.engine-test/auryn/market-truth.js');

const checks=[];const check=(name,ok,detail='')=>checks.push({name,ok,detail});
const q=(provider,price,age=10,freshness='LIVE',ts='2026-09-09T15:00:00.000Z')=>({provider,symbol:'TEST',price,bid:null,ask:null,spreadPct:null,changePct:null,providerTimestamp:ts,ageSeconds:age,session:'REGULAR',freshness,isRealTime:freshness==='LIVE'});
const scenarios=[
 ['regular',new Date('2026-09-09T15:00:10.000Z'),q('alpaca',100),q('twelvedata',100.2),99,true],
 ['after-hours',new Date('2026-09-09T22:00:00.000Z'),q('alpaca',101,7200,'STALE'),q('twelvedata',101.1,7200,'STALE'),100,false],
 ['overnight',new Date('2026-09-10T02:00:00.000Z'),null,null,100,false],
 ['weekend',new Date('2026-09-12T16:00:00.000Z'),null,null,100,false],
];
for(const [name,asOf,p,s,c,exec] of scenarios){const snap=buildCanonicalMarketSnapshot({symbol:'TEST',asOf,primary:p,secondary:s,regularClose:c,regularCloseTimestamp:'2026-09-09T20:00:00.000Z'});check(`session:${name}:research`,snap.displayPrice!=null&&snap.priceSensitiveAllowed,snap.reason);check(`session:${name}:execution`,snap.executionTradable===exec,`${snap.session}/${snap.priceUse}`);}
const baseMarket=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-10T02:00:00.000Z'),regularClose:100,regularCloseTimestamp:'2026-09-09T20:00:00.000Z'});
const fingerprints=[];for(let i=0;i<100;i++)fingerprints.push(buildDecisionSnapshot({symbol:'TEST',asOf:'2026-09-10T02:00:00.000Z',marketTruth:baseMarket,completedDailyBarCutoff:'2026-09-09',fundamentalsAsOf:'2026-09-09',earningsAsOf:null,estimatesAsOf:null,newsCutoff:'2026-09-09T23:00:00.000Z',macroAsOf:'2026-09-09',featureVersion:'v9.3',modelVersion:'v7',policyVersion:'v9.3.1',evidence:{b:2,a:1}}).fingerprint);
const det=auditDeterministicFingerprints(fingerprints);check('snapshot:100x-determinism',det.ok,det.issues.join('; '));
const surfaces=auditCrossSurfaceDecision(['stock','watchlist','portfolio','market','scan'].map(surface=>({surface,snapshotId:'s1',price:100,action:'HOLD',ownerAction:'HOLD',setupState:'REPAIRING'})));check('cross-surface:canonical-invariant',surfaces.ok,surfaces.issues.join('; '));
const transition=auditDecisionTransition({previousAction:'BUY',nextAction:'HOLD',changedEvidence:['tech.reclaim'],trigger:'Completed daily reclaim failed'});check('decision-change:causal-attribution',transition.ok,transition.issues.join('; '));
const sourceFiles=['app/api/quote/[symbol]/route.ts','app/api/market/route.ts','app/api/portfolio/pulse/route.ts','app/api/scan/route.ts'];
const decisionSurfaceFiles=['app/api/decision/summaries/route.ts','app/watchlist/page.tsx','app/portfolio/page.tsx','app/alerts/page.tsx'];
for(const f of sourceFiles){const s=fs.readFileSync(f,'utf8');check(`source:${f}:gateway`,/market-data-gateway/.test(s),'must consume canonical market gateway');}
for(const f of decisionSurfaceFiles){const s=fs.readFileSync(f,'utf8');check(`surface:${f}:canonical-decision`,f.includes('decision/summaries')?/market-data-gateway/.test(s):/decision\/summaries/.test(s),'must consume the canonical decision/Market Truth projection');}
check('source:market:no-direct-current-provider',!/api\.twelvedata\.com\/time_series/.test(fs.readFileSync('app/api/market/route.ts','utf8')));
check('source:portfolio-pulse:no-direct-price-provider',!/api\.twelvedata\.com\/price/.test(fs.readFileSync('app/api/portfolio/pulse/route.ts','utf8')));
check('surface:decision-summaries:canonical-contract',/AURYN_V9_3_4_CANONICAL_SURFACE/.test(fs.readFileSync('app/api/decision/summaries/route.ts','utf8')),'V9.3.4 supersedes the V9.3.1 canonical surface contract');
check('surface:watchlist:no-scanner-call',!/x\.action&&<strong/.test(fs.readFileSync('app/watchlist/page.tsx','utf8')));
check('surface:investment:stored-action-only',/storedAction:x\.action/.test(fs.readFileSync('app/api/investment/route.ts','utf8')));
const failures=checks.filter(x=>!x.ok);const report={version:'auryn-v9.3.1',generatedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',checks,failures};
console.log(JSON.stringify(report,null,2));if(failures.length)process.exit(1);
