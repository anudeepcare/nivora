/** Shared data boundaries: a failed request is not an empty successful result. */
export function providerNumber(value:unknown):number|null {
 if(value===null||value===undefined||typeof value==='boolean'||(typeof value==='string'&&!value.trim()))return null;
 const n=Number(value);return Number.isFinite(n)?n:null;
}
export function workspaceReadResult(research:PromiseSettledResult<any[]>,watch:{data:any[]|null;error:unknown},positions:{data:any[]|null;error:unknown}){
 const rows=research.status==='fulfilled'?research.value:[];
 return {rows,watchSymbols:(watch.data??[]).map(x=>x.symbol),portfolioSymbols:(positions.data??[]).map(x=>x.symbol),storage:research.status==='fulfilled'?'account':'unavailable',limitations:[
  ...(research.status==='rejected'?['Saved notes and alerts are temporarily unavailable. Your existing watchlist and holdings remain accessible.']:[]),
  ...(watch.error?['Your watchlist could not be loaded.']:[]),...(positions.error?['Your portfolio could not be loaded.']:[]),
  ...(rows.length===600?['Showing the 600 most recent saved research records.']:[])
 ]};
}
export function discoveryRows(rows:any[],now=Date.now()){
 const latest=new Map<string,any>();
 for(const row of [...rows].sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at))){
  const age=now-Date.parse(row.observed_at);if(!row.symbol||!Number.isFinite(age)||age<0||age>7*86400000||latest.has(row.symbol))continue;
  const d=row.assessment??row.evidence?.v931??{},f=row.financial??row.evidence?.financialEvidence??{};
  const metrics=(Array.isArray(f.metrics)?f.metrics:[]).filter((m:any)=>providerNumber(m.value)!==null&&m.source).map((m:any)=>({...m,value:providerNumber(m.value)}));
  // This endpoint exposes recorded evidence, never upgrades a legacy snapshot's authority.
  latest.set(row.symbol,{symbol:row.symbol,name:row.company_name??row.symbol,price:null,changePct:null,companyScore:null,thesisScore:null,opportunityScore:null,confidence:null,
   action:'REVIEW',reason:metrics.length?'Reported financial evidence available':'Open the company for its current assessment',mainRisk:null,
   scannedAt:row.observed_at,changedAt:null,previousAction:null,metrics,businessModel:f.thesis?.businessModel??null,
   businessAssessment:d.dimensions?.business?.assessment??null,source:'Recorded research',assessmentRequiresRefresh:true});
 }
 return [...latest.values()].sort((a,b)=>b.metrics.length-a.metrics.length||Date.parse(b.scannedAt)-Date.parse(a.scannedAt));
}
export function optionQuoteEligible(q:{bid:number|null;ask:number|null;mid:number|null;delta:number|null;openInterest:number|null;updated:number|null},now=Date.now()){
 const {bid,ask,mid,delta,openInterest,updated}=q;
 return bid!==null&&ask!==null&&mid!==null&&delta!==null&&openInterest!==null&&updated!==null&&bid>0&&ask>=bid&&mid>0&&Math.abs(delta)<=1&&openInterest>=20&&(ask-bid)/mid<=.25&&now-updated*1000>=0&&now-updated*1000<=3600000;
}
