
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const round=(x:number,d=2)=>+x.toFixed(d);
function median(xs:number[]){if(!xs.length)return 0;const s=[...xs].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
function wilson(w:number,n:number){if(!n)return null;const z=1.96,p=w/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return{lowPct:round((c-m)*100,1),highPct:round((c+m)*100,1)}}
export type CalibrationRow={score:number;alphaPct:number;archetype?:string};
export function summarizeCalibration(rows:CalibrationRow[],minimum=100){
 const clean=rows.filter(r=>Number.isFinite(r.score)&&Number.isFinite(r.alphaPct));
 const n=clean.length,wins=clean.filter(r=>r.alphaPct>0).length,alphas=clean.map(r=>r.alphaPct);
 const hitRatePct=n?round(wins/n*100,1):0,avgAlphaPct=n?round(alphas.reduce((a,b)=>a+b,0)/n,2):0,medianAlphaPct=round(median(alphas),2);
 const meanScore=n?clean.reduce((a,r)=>a+r.score,0)/n:0,meanAlpha=n?alphas.reduce((a,b)=>a+b,0)/n:0;
 const cov=n?clean.reduce((a,r)=>a+(r.score-meanScore)*(r.alphaPct-meanAlpha),0)/n:0,sdS=n?Math.sqrt(clean.reduce((a,r)=>a+(r.score-meanScore)**2,0)/n):0,sdA=n?Math.sqrt(alphas.reduce((a,v)=>a+(v-meanAlpha)**2,0)/n):0;
 const scoreAlphaCorrelation=sdS&&sdA?round(cov/(sdS*sdA),3):0,alphaStdDevPct=round(sdA,2),informationRatio=sdA?round(meanAlpha/sdA,3):0;
 const brierScore=n?round(clean.reduce((s,r)=>{const p=clamp(r.score/100),y=r.alphaPct>0?1:0;return s+(p-y)*(p-y)},0)/n,4):0;
 const buckets=new Map<number,{n:number,p:number,y:number}>();for(const r of clean){const b=Math.min(9,Math.floor(clamp(r.score/100)*10)),x=buckets.get(b)||{n:0,p:0,y:0};x.n++;x.p+=clamp(r.score/100);x.y+=r.alphaPct>0?1:0;buckets.set(b,x)}
 const ece=n?round([...buckets.values()].reduce((s,b)=>s+(b.n/n)*Math.abs(b.p/b.n-b.y/b.n),0)*100,2):0;
 const status=n<minimum?"COLLECTING" as const:"CALIBRATED" as const;
 return{status,n,minimum,hitRatePct,avgAlphaPct,medianAlphaPct,alphaStdDevPct,informationRatio,scoreAlphaCorrelation,brierScore,expectedCalibrationErrorPct:ece,confidence95:wilson(wins,n),reliabilityScore:status==="CALIBRATED"?Math.max(0,Math.min(100,Math.round(100-(brierScore*55+ece*.45)))):null};
}
