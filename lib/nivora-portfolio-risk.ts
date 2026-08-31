export type PortfolioHolding={symbol:string;marketValue:number;sector?:string|null;archetype?:string|null;returns?:number[]};
export type PortfolioRisk={concentrationPct:number;largestPositionPct:number;largestSectorPct:number;effectivePositions:number;correlationWarning:string|null;riskLabel:"LOW"|"MODERATE"|"HIGH";sizingGate:"NORMAL"|"REDUCED"|"BLOCK ADD";maxNewPositionPct:number;notes:string[]};
const finite=(x:any)=>Number.isFinite(Number(x));
function corr(a:number[]=[],b:number[]=[]){const n=Math.min(a.length,b.length);if(n<20)return null;const x=a.slice(-n),y=b.slice(-n),mx=x.reduce((s,v)=>s+v,0)/n,my=y.reduce((s,v)=>s+v,0)/n;let c=0,vx=0,vy=0;for(let i=0;i<n;i++){const dx=x[i]-mx,dy=y[i]-my;c+=dx*dy;vx+=dx*dx;vy+=dy*dy}return vx&&vy?c/Math.sqrt(vx*vy):null}
export function analyzePortfolioRisk(holdings:PortfolioHolding[]):PortfolioRisk{
 const clean=holdings.filter(h=>finite(h.marketValue)&&h.marketValue>0),total=clean.reduce((s,h)=>s+h.marketValue,0);if(!total)return{concentrationPct:0,largestPositionPct:0,largestSectorPct:0,effectivePositions:0,correlationWarning:null,riskLabel:"LOW",sizingGate:"NORMAL",maxNewPositionPct:5,notes:["No funded positions available for portfolio-risk analysis."]};
 const weights=clean.map(h=>h.marketValue/total),largest=Math.max(...weights)*100,hh=weights.reduce((s,w)=>s+w*w,0),effective=hh?1/hh:0;
 const sectors=new Map<string,number>();clean.forEach(h=>sectors.set(h.sector||h.archetype||"Unknown",(sectors.get(h.sector||h.archetype||"Unknown")||0)+h.marketValue));const largestSector=Math.max(...sectors.values())/total*100;
 let maxCorr=-2,pair="";for(let i=0;i<clean.length;i++)for(let j=i+1;j<clean.length;j++){const c=corr(clean[i].returns,clean[j].returns);if(c!=null&&c>maxCorr){maxCorr=c;pair=`${clean[i].symbol}/${clean[j].symbol}`}}
 const notes:string[]=[];if(largest>=20)notes.push(`Largest position is ${largest.toFixed(1)}% of tracked equity.`);if(largestSector>=35)notes.push(`Largest sector/archetype exposure is ${largestSector.toFixed(1)}%.`);if(effective<5&&clean.length>=5)notes.push(`Effective diversification is only ${effective.toFixed(1)} positions after concentration.`);if(maxCorr>=.8)notes.push(`${pair} have very high observed return correlation (${maxCorr.toFixed(2)}).`);
 const riskLabel=largest>=30||largestSector>=50||effective<3?"HIGH":largest>=18||largestSector>=35||effective<6?"MODERATE":"LOW";
 const sizingGate:PortfolioRisk["sizingGate"]=riskLabel==="HIGH"?"BLOCK ADD":riskLabel==="MODERATE"?"REDUCED":"NORMAL";
 const maxNewPositionPct=riskLabel==="HIGH"?0:riskLabel==="MODERATE"?2.5:5;
 if(sizingGate==="BLOCK ADD")notes.push("Portfolio context should block additional correlated exposure until concentration improves; this does not change the underlying company thesis.");
 else if(sizingGate==="REDUCED")notes.push("Use reduced sizing for new positions until concentration/correlation risk improves.");
 return{concentrationPct:+(hh*100).toFixed(1),largestPositionPct:+largest.toFixed(1),largestSectorPct:+largestSector.toFixed(1),effectivePositions:+effective.toFixed(1),correlationWarning:maxCorr>=.8?`${pair} correlation ${maxCorr.toFixed(2)}`:null,riskLabel,sizingGate,maxNewPositionPct,notes};
}
