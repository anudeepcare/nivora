export const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
export const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export const sma=(a:number[],n:number)=>avg(a.slice(-Math.min(n,a.length)));
export const rnd=(n:number,d=2)=>Math.round(n*10**d)/10**d;
export const pct=(now:number,prior:number)=>prior?((now/prior)-1)*100:0;
export function ema(values:number[], period:number){
  if(!values.length) return [];
  const k=2/(period+1); const out=[values[0]];
  for(let i=1;i<values.length;i++) out.push(values[i]*k+out[i-1]*(1-k));
  return out;
}
export function rsi(values:number[], period=14){
  if(values.length<=period) return 50;
  const changes=values.slice(1).map((v,i)=>v-values[i]);
  let gains=0,losses=0;
  for(const c of changes.slice(-period)){ if(c>0) gains+=c; else losses-=c; }
  const ag=gains/period, al=losses/period;
  if(al===0) return 100;
  const rs=ag/al; return 100-(100/(1+rs));
}
export function atr(rows:any[],period=14){
  const tr=rows.map((x:any,i:number)=>{
    const h=+x.high,l=+x.low,pc=i?+rows[i-1].close:+x.close;
    return Math.max(h-l,Math.abs(h-pc),Math.abs(l-pc));
  });
  return avg(tr.slice(-period));
}
export function stddev(values:number[],period=20){
  const x=values.slice(-Math.min(period,values.length)); if(!x.length)return 0;
  const m=avg(x); return Math.sqrt(avg(x.map(v=>(v-m)**2)));
}
export function macd(values:number[]){
  const e12=ema(values,12),e26=ema(values,26); const line=values.map((_,i)=>(e12[i]??0)-(e26[i]??0));
  const signal=ema(line,9); const last=line.at(-1)??0,sig=signal.at(-1)??0;
  return {line:last,signal:sig,hist:last-sig};
}
export function obv(closes:number[],volumes:number[]){
  let v=0;const out=[0];for(let i=1;i<closes.length;i++){v+=closes[i]>closes[i-1]?volumes[i]:closes[i]<closes[i-1]?-volumes[i]:0;out.push(v)}return out;
}
export function slope(values:number[],period=10){
  const x=values.slice(-Math.min(period,values.length)); if(x.length<2)return 0; return (x.at(-1)!-x[0])/(x.length-1);
}
