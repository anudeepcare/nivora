export type FactorRow=Record<string,number|null|undefined>;
export type FactorCorrelation={a:string;b:string;correlation:number;n:number;severity:"LOW"|"WATCH"|"HIGH"};
const finite=(x:any)=>Number.isFinite(Number(x));
function corr(x:number[],y:number[]){const n=Math.min(x.length,y.length);if(n<8)return null;const mx=x.reduce((s,v)=>s+v,0)/n,my=y.reduce((s,v)=>s+v,0)/n;let c=0,vx=0,vy=0;for(let i=0;i<n;i++){const dx=x[i]-mx,dy=y[i]-my;c+=dx*dy;vx+=dx*dx;vy+=dy*dy}return vx&&vy?c/Math.sqrt(vx*vy):null}
export function factorCorrelationAudit(rows:FactorRow[],keys:string[],threshold=.55):FactorCorrelation[]{
 const out:FactorCorrelation[]=[];
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
   const a:number[]=[],b:number[]=[];for(const r of rows){if(finite(r[keys[i]])&&finite(r[keys[j]])){a.push(Number(r[keys[i]]));b.push(Number(r[keys[j]]))}}
   const c=corr(a,b);if(c==null)continue;const ac=Math.abs(c);if(ac>=threshold)out.push({a:keys[i],b:keys[j],correlation:+c.toFixed(3),n:a.length,severity:ac>=.8?"HIGH":ac>=.65?"WATCH":"LOW"});
 }
 return out.sort((x,y)=>Math.abs(y.correlation)-Math.abs(x.correlation));
}
export function uniqueInformationBudget(correlations:FactorCorrelation[]){
 const penalty=new Map<string,number>();for(const c of correlations){const p=Math.max(0,Math.abs(c.correlation)-.5);penalty.set(c.a,(penalty.get(c.a)||0)+p/2);penalty.set(c.b,(penalty.get(c.b)||0)+p/2)}
 return Object.fromEntries([...penalty.entries()].map(([k,p])=>[k,+Math.max(.45,1-Math.min(.55,p)).toFixed(2)]));
}
