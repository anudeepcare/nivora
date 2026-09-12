import {createHash} from "node:crypto";

export type AurynDecisionAuditRow={
 symbol?:string;
 snapshotId?:string;
 newMoneyAction?:string;
 ownerAction?:string;
 longTermAction?:string;
 opportunityScore?:number|null;
 entryQuality?:number|null;
 evidenceQuality?:number|null;
 decisionScore?:number|null;
 hardVetoReasons?:string[];
 policyReasons?:string[];
 closestPath?:string|null;
 distanceToBuy?:number|null;
 currentPrice?:number|null;
 bearValue?:number|null;
 baseValue?:number|null;
 bullValue?:number|null;
};

type CountMap=Record<string,number>;
const finite=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x);
const pct=(n:number,d:number)=>d?Number(((n/d)*100).toFixed(1)):0;
const sortMap=(m:CountMap)=>Object.fromEntries(Object.entries(m).sort(([a],[b])=>a.localeCompare(b)));
const count=(rows:AurynDecisionAuditRow[],key:keyof AurynDecisionAuditRow)=>{
 const out:CountMap={};
 for(const row of rows){const v=String(row[key]??"UNKNOWN").trim().toUpperCase()||"UNKNOWN";out[v]=(out[v]||0)+1;}
 return sortMap(out);
};
const reasonCounts=(rows:AurynDecisionAuditRow[],key:"hardVetoReasons"|"policyReasons")=>{
 const out:CountMap={};
 for(const row of rows)for(const raw of row[key]||[]){const reason=String(raw||"").trim();if(reason)out[reason]=(out[reason]||0)+1;}
 return Object.entries(out).map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason));
};
const histogram=(rows:AurynDecisionAuditRow[],key:"opportunityScore"|"entryQuality"|"evidenceQuality"|"decisionScore")=>{
 const out:Record<string,number>={"0-19":0,"20-39":0,"40-59":0,"60-79":0,"80-100":0,"MISSING":0};
 for(const row of rows){const v=row[key];if(!finite(v)){out.MISSING++;continue;}if(v<20)out["0-19"]++;else if(v<40)out["20-39"]++;else if(v<60)out["40-59"]++;else if(v<80)out["60-79"]++;else out["80-100"]++;}
 return out;
};
const contradiction=(rows:AurynDecisionAuditRow[],predicate:(r:AurynDecisionAuditRow)=>boolean)=>{
 const symbols=rows.filter(predicate).map(r=>r.symbol||"?").sort();return{count:symbols.length,symbols};
};
const quantile=(xs:number[],q:number)=>{if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);const i=(s.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);return Number((s[lo]+(s[hi]-s[lo])*(i-lo)).toFixed(3));};

export function auditAurynDecisions(input:AurynDecisionAuditRow[]){
 const rows=input.map(r=>({...r,hardVetoReasons:[...(r.hardVetoReasons||[])],policyReasons:[...(r.policyReasons||[])]}));
 const total=rows.length;
 const newMoney=count(rows,"newMoneyAction"),owner=count(rows,"ownerAction"),longTerm=count(rows,"longTermAction");
 const dominant=Object.entries(newMoney).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]||["UNKNOWN",0];
 const dominantShare=pct(Number(dominant[1]),total);

 const validScenario:any[]=[];let missing=0,invalidGeometry=0;
 for(const r of rows){
  const {currentPrice:spot,bearValue:bear,baseValue:base,bullValue:bull}=r;
  if(!finite(spot)||!finite(bear)||!finite(base)||!finite(bull)||spot<=0){missing++;continue;}
  if(!(bear<base&&base<bull)){invalidGeometry++;continue;}
  validScenario.push({spot,bear,base,bull,baseDistance:Math.abs(base/spot-1)*100,bearSpread:(base-bear)/spot*100,bullSpread:(bull-base)/spot*100});
 }
 const within2=validScenario.filter(x=>x.baseDistance<2).length;
 const within5=validScenario.filter(x=>x.baseDistance<=5).length;
 const within10=validScenario.filter(x=>x.baseDistance<=10).length;
 const anchoringShare=validScenario.length?within5/validScenario.length:0;
 const scenarioFlag=validScenario.length>=8&&anchoringShare>=.75?"WATCH":"OK";

 const closestToUpgrade=rows.filter(r=>String(r.newMoneyAction||"").toUpperCase()==="WAIT"&&finite(r.distanceToBuy)&&r.distanceToBuy!>0)
  .sort((a,b)=>Number(a.distanceToBuy)-Number(b.distanceToBuy)||(a.symbol||"").localeCompare(b.symbol||""))
  .slice(0,25).map(r=>({symbol:r.symbol||"?",distance:Number(r.distanceToBuy),closestPath:r.closestPath||null,primaryBlocker:(r.policyReasons||[])[0]||(r.hardVetoReasons||[])[0]||null}));

 const canonical={
  schemaVersion:"auryn-v9.6.3-decision-scenario-audit-1",
  total,
  distributions:{newMoney,owner,longTerm},
  scoreHistograms:{opportunity:histogram(rows,"opportunityScore"),entryQuality:histogram(rows,"entryQuality"),evidenceQuality:histogram(rows,"evidenceQuality"),decision:histogram(rows,"decisionScore")},
  blockers:{hard:reasonCounts(rows,"hardVetoReasons"),policy:reasonCounts(rows,"policyReasons")},
  contradictions:{
   attractiveAvoid:contradiction(rows,r=>String(r.longTermAction).toUpperCase()==="ATTRACTIVE"&&String(r.newMoneyAction).toUpperCase()==="AVOID"),
   highEvidenceAvoid:contradiction(rows,r=>finite(r.evidenceQuality)&&r.evidenceQuality>=85&&String(r.newMoneyAction).toUpperCase()==="AVOID"),
   strongOpportunityWait:contradiction(rows,r=>finite(r.opportunityScore)&&r.opportunityScore>=70&&String(r.newMoneyAction).toUpperCase()==="WAIT"),
   attractiveReduce:contradiction(rows,r=>String(r.longTermAction).toUpperCase()==="ATTRACTIVE"&&String(r.ownerAction).toUpperCase()==="REDUCE")
  },
  closestToUpgrade,
  scenario:{
   valid:validScenario.length,missing,invalidGeometry,
   baseAnchoring:{within2Pct:{count:within2,pct:pct(within2,validScenario.length)},within5Pct:{count:within5,pct:pct(within5,validScenario.length)},within10Pct:{count:within10,pct:pct(within10,validScenario.length)}},
   spreads:{bearMedianPct:quantile(validScenario.map(x=>x.bearSpread),.5),bullMedianPct:quantile(validScenario.map(x=>x.bullSpread),.5),baseDistanceMedianPct:quantile(validScenario.map(x=>x.baseDistance),.5)},
   independence:{flag:scenarioFlag,reason:scenarioFlag==="WATCH"?"Base case is within ±5% of spot for at least 75% of valid audited scenarios; review for price anchoring before calibration.":"No high-concentration base-price anchoring flag in this sample."}
  },
  diagnostics:{
   decisionDispersion:{flag:total>=10&&dominantShare>=80?"WATCH":"OK",dominantAction:String(dominant[0]),dominantSharePct:dominantShare,reason:total>=10&&dominantShare>=80?"One new-money action represents at least 80% of audited decisions. Diagnose gates before changing thresholds.":"No extreme action concentration flag in this sample."},
   highQualityWait:contradiction(rows,r=>String(r.longTermAction).toUpperCase()==="ATTRACTIVE"&&String(r.newMoneyAction).toUpperCase()==="WAIT"),
   highQualityAvoid:contradiction(rows,r=>String(r.longTermAction).toUpperCase()==="ATTRACTIVE"&&String(r.newMoneyAction).toUpperCase()==="AVOID")
  }
 };
 const fingerprint=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 return {...canonical,fingerprint};
}
