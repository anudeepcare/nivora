import type {OpportunityLens,OpportunityScores} from './domain';

type Input={action?:string|null;hardVeto?:boolean;scores:OpportunityScores};
const finite=(v:any)=>{if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
const rrScore=(v:number|null)=>v==null||v<=0||v>12?null:clamp(38+(Math.min(v,4)-1)*20);
const volQuality=(v:number|null)=>v==null?null:clamp(100-v);

export function buildOpportunityLens(input:Input):OpportunityLens{
 const s=input.scores;
 const candidates:[string,number|null,number][]=[
  ['Business',finite(s.business),22],['Earnings / revisions',finite(s.earningsRevisions),18],['Valuation',finite(s.valuation),15],['Market structure',finite(s.marketStructure),10],['Catalysts / regime',finite(s.catalystsRegime),7],['Risk / asymmetry',finite(s.riskAsymmetry),13],['Entry quality',finite(s.entryQuality),5],['Relative strength',finite(s.relativeStrength),3],['Participation',finite(s.participation),3],['Reward / risk',rrScore(finite(s.rewardRisk)),2],['Volatility',volQuality(finite(s.volatilityRisk)),2]
 ];
 const totalWeight=candidates.reduce((a,x)=>a+x[2],0);
 const available=candidates.filter(([,v])=>v!=null) as [string,number,number][];
 const availableWeight=available.reduce((a,x)=>a+x[2],0);
 let score=availableWeight?available.reduce((a,[,v,w])=>a+v*w,0)/availableWeight:0;
 const coverage=Math.round(availableWeight/totalWeight*100);
 const constraints:string[]=[];
 if(finite(s.valuation)==null)constraints.push('Valuation evidence is unavailable, so conviction is capped rather than treated as bearish.');
 if(finite(s.entryQuality)!=null&&Number(s.entryQuality)<50)constraints.push('Entry quality is weak at the current price.');
 if(finite(s.riskAsymmetry)!=null&&Number(s.riskAsymmetry)<50)constraints.push('Current risk/asymmetry is unfavorable.');
 if(finite(s.participation)!=null&&Number(s.participation)<50)constraints.push('Participation is not confirming the move.');
 if(input.hardVeto){constraints.unshift('Hard veto is active because risk/thesis integrity failed.');score=Math.min(score,45)}
 if(finite(s.valuation)==null)score=Math.min(score,79);
 const supports=available.slice().sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>=60).slice(0,4).map(([n,v])=>`${n} ${Math.round(v)}/100`);
 const positive=clamp((score-50)*1.15+50);
 const riskDrag=clamp(50-(finite(s.riskAsymmetry)??50))*0.35 + clamp(50-(finite(s.marketStructure)??50))*0.25 + clamp(50-(finite(s.entryQuality)??50))*0.2;
 let bull=clamp(Math.round(positive*.58-riskDrag*.25),5,80);
 let bear=clamp(Math.round((100-score)*.35+riskDrag*.35),5,70);
 let base=100-bull-bear;
 if(base<10){const deficit=10-base;bull=Math.max(5,bull-Math.ceil(deficit*.6));bear=Math.max(5,bear-Math.floor(deficit*.4));base=100-bull-bear}
 const scenarioBalance={bull,base,bear,calibrated:false as const,label:'Scenario balance · not probability'};
 return{opportunityScore:Math.round(clamp(score)),coverage,supports,constraints,scenarioBalance};
}
