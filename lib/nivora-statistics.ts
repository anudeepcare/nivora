
const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
function rng(seed:number){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function quantile(sorted:number[],q:number){if(!sorted.length)return 0;const i=(sorted.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i),w=i-lo;return sorted[lo]*(1-w)+sorted[hi]*w}
export function bootstrapMeanCI(values:number[],iterations=2000,confidence=.95,seed=1){
 const xs=values.filter(Number.isFinite);const m=mean(xs);if(!xs.length)return{mean:0,low:0,high:0,iterations:0};
 const r=rng(seed),boots:number[]=[];
 for(let k=0;k<iterations;k++){let s=0;for(let i=0;i<xs.length;i++)s+=xs[Math.floor(r()*xs.length)];boots.push(s/xs.length)}
 boots.sort((a,b)=>a-b);const a=(1-confidence)/2;
 return{mean:+m.toFixed(6),low:+quantile(boots,a).toFixed(6),high:+quantile(boots,1-a).toFixed(6),iterations};
}
export function permutationMeanDifferencePValue(a:number[],b:number[],iterations=2000,seed=1){
 const x=a.filter(Number.isFinite),y=b.filter(Number.isFinite),observed=mean(x)-mean(y),pool=[...x,...y],n=x.length,r=rng(seed);
 if(!x.length||!y.length)return{meanDifference:observed,pValue:1,iterations:0};
 let extreme=0;
 for(let k=0;k<iterations;k++){
  const arr=[...pool];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  const d=mean(arr.slice(0,n))-mean(arr.slice(n));
  if(Math.abs(d)>=Math.abs(observed))extreme++;
 }
 return{meanDifference:+observed.toFixed(6),pValue:+((extreme+1)/(iterations+1)).toFixed(6),iterations};
}
