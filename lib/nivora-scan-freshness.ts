export function freshnessDistribution(total:number,under24h:number,under7d:number,under30d:number){
 const safe=Math.max(0,total);const pct=(n:number)=>safe?Math.round(Math.max(0,Math.min(safe,n))/safe*1000)/10:0;
 return{under24h,under7d,under30d,staleOver30d:Math.max(0,safe-under30d),under24hPct:pct(under24h),under7dPct:pct(under7d),under30dPct:pct(under30d)};
}
