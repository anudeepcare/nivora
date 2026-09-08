import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeModelProof} from '../.engine-test/auryn/v6/proof.js';
import {applyPortfolioCioOverlay} from '../.engine-test/auryn/v6/portfolio-cio.js';
import {runV5ReliabilityMatrix} from '../.engine-test/auryn/v5/reliability.js';

const pr=(gate='NORMAL')=>({concentrationPct:10,largestPositionPct:10,largestSectorPct:20,effectivePositions:8,correlationWarning:null,riskLabel:gate==='BLOCK ADD'?'HIGH':gate==='REDUCED'?'MODERATE':'LOW',sizingGate:gate,maxNewPositionPct:gate==='BLOCK ADD'?0:gate==='REDUCED'?2.5:5,notes:[]});
const outcome=(action,alpha,regime='NEUTRAL',horizon='90D')=>({action,alphaPct:alpha,horizon,archetype:'GENERAL_COMPOUNDER',regime,maxDrawdownPct:-8,confidenceScore:70});

function runV6Matrix(){
 const samples=[0,30,120,700],ladders=[true,false],regimes=[1,3],horizons=[1,3],alphas=[-3,2,8],gates=['NORMAL','REDUCED','BLOCK ADD'],actions=['STRONG_BUY','BUY','HOLD','REDUCE','SELL'],owns=[false,true],positions=[5,18];
 let cases=0;const violations=[];
 for(const n of samples)for(const ladder of ladders)for(const rN of regimes)for(const hN of horizons)for(const alpha of alphas)for(const gate of gates)for(const action of actions)for(const own of owns)for(const position of positions){
   cases++;const rows=[];const acts=ladder?['STRONG_BUY','BUY','HOLD','REDUCE','SELL']:['BUY','STRONG_BUY','HOLD','REDUCE','SELL'];
   for(let i=0;i<n;i++){const a=acts[i%acts.length],goodRank={STRONG_BUY:10,BUY:6,HOLD:1,REDUCE:-3,SELL:-7},badRank={STRONG_BUY:2,BUY:8,HOLD:1,REDUCE:-3,SELL:-7},rank=(ladder?goodRank:badRank)[a]??alpha;rows.push(outcome(a,alpha>=0?rank:alpha,rN===3?['RISK_ON','NEUTRAL','RISK_OFF'][i%3]:'NEUTRAL',hN===3?['30D','90D','180D'][i%3]:'90D'))}
   const proof=summarizeModelProof(rows);
   if(n<120&&proof.promotion.eligible)violations.push(`premature-promotion:${cases}`);
   if(!ladder&&n>=120&&proof.promotion.eligible)violations.push(`nonmonotonic-promotion:${cases}`);
   const overlay=applyPortfolioCioOverlay({independentAction:action,portfolioRisk:pr(gate),owns:own,currentPositionPct:position,sameArchetypeExposurePct:20});
   if(overlay.companyAction!==action)violations.push(`thesis-mutated:${cases}`);
   if(gate==='BLOCK ADD'&&['BUY','STRONG_BUY'].includes(action)&&overlay.portfolioAction!=='BLOCK_ADD')violations.push(`portfolio-gate-missed:${cases}`);
 }
 return{cases,violations};
}

test('V6 proof/portfolio reliability matrix adds thousands of institutional decision cases with no invariant violations',()=>{
 const v5=runV5ReliabilityMatrix(),v6=runV6Matrix();
 assert.ok(v5.cases+v6.cases>=20000);
 assert.equal(v5.violations.length,0);
 assert.deepEqual(v6.violations,[]);
});
