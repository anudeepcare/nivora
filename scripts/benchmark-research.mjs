// Run: node --experimental-strip-types scripts/benchmark-research.mjs
// Local synthetic evidence only: no credentials, market requests or trades.
import {performance} from 'node:perf_hooks';
import {demoData} from '../tests/fixtures/demo.ts';
import {perspective} from '../lib/analysis.ts';
import {researchDecision} from '../lib/decision-research.ts';
const base=demoData.research.MSFT,start=performance.now();
for(let i=0;i<50;i++){const r={...base,quote:{...base.quote,price:400+i/100}};perspective(r);researchDecision(r);researchDecision(r);}
console.log(JSON.stringify({fixture:'MSFT synthetic',quoteUpdates:50,perspectivesPerUpdate:1,decisionsPerUpdate:2,elapsedMs:performance.now()-start,scope:'Node calculation sample; not browser or iPhone latency'}));
